import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Barcode,
  FileText,
  Upload,
  Sparkles,
  Loader2,
  Check,
  X,
  Edit2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useItems, ItemCategory } from "@/hooks/useItems";
import { CATEGORIES, getDefaultImageForCategory } from "@/types/inventory";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
} from "@zxing/library";

// Security Note: Use server-side proxy in production
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ZXing setup
const codeReader = new BrowserMultiFormatReader();
const hints = new Map();
const formats = [
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_128,
  BarcodeFormat.QR_CODE,
];
hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
codeReader.hints = hints;

// BULLETPROOF JSON PARSER — handles ```json, extra text, etc.
const parseJsonSafely = (text: string): any => {
  try {
    let cleaned = text
      .trim()
      .replace(/```json|```/g, "")
      .trim();

    const start = cleaned.search(/[{\[]/);
    if (start === -1) return null;

    let brace = 0;
    let bracket = 0;
    let end = start;

    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === "{") brace++;
      if (cleaned[i] === "}") brace--;
      if (cleaned[i] === "[") bracket++;
      if (cleaned[i] === "]") bracket--;
      if (brace === 0 && bracket === 0) {
        end = i + 1;
        break;
      }
    }

    return JSON.parse(cleaned.slice(start, end));
  } catch (e) {
    console.error("JSON parse failed. Raw response:", text);
    return null;
  }
};

type ScanMode = "photo" | "barcode" | "receipt";

interface DetectedItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price?: number;
  confidence: number;
}

interface ItemDetails {
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  price: string;
  expiry_date: string;
  description: string;
}

export default function ScanItem() {
  const { createItem } = useItems();
  const [mode, setMode] = useState<ScanMode>("photo");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DetectedItem | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const resizeImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let { width, height } = img;
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = base64;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      let base64Image = reader.result as string;
      base64Image = await resizeImage(base64Image);
      setImagePreview(base64Image);
      setIsAnalyzing(true);
      setDetectedItems([]);

      try {
        if (mode === "barcode") {
          try {
            const result = await codeReader.decodeFromImageUrl(base64Image);
            const barcodeValue = result.getText();

            toast({
              title: "Barcode Scanned",
              description: `Code: ${barcodeValue}`,
            });

            await fetchProductDetailsFromBarcode(barcodeValue);
            return;
          } catch (err) {
            console.log("No barcode detected, falling back to vision");
            toast({
              title: "No barcode found",
              description: "Trying AI image analysis...",
            });
          }
        }

        const base64Data = base64Image.split(",")[1];
        const mimeType = file.type || "image/jpeg";

        let prompt = `
          Analyze this image and detect all home-related inventory items (e.g., food, electronics, cleaning supplies, etc.).
          Ignore non-inventory items like people, walls, or backgrounds.
          For each detected item, provide:
          - name: The common name of the item
          - category: Classify strictly into one of these existing categories: ${CATEGORIES.map(
            (c) => c.id
          ).join(", ")}
          - quantity: Estimated quantity visible (default to 1 if unclear)
          - unit: Estimated unit (e.g., pcs, kg, liters; default to 'pcs')
          - price: Optional estimated average price in USD
          - confidence: Your confidence in detection (0-100)
          Return as JSON array of objects, e.g., [{"name": "...", "category": "...", ...}]
        `;

        if (mode === "receipt") {
          prompt = prompt.replace(
            "detect all home-related inventory items",
            "extract all purchased items from this receipt"
          );
        }

        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Data, mimeType } },
        ]);

        const responseText = result.response.text();
        const parsed = parseJsonSafely(responseText);
        if (!parsed) throw new Error("Invalid JSON from Gemini");

        const items = parsed as DetectedItem[];

        if (items.length > 0) {
          setDetectedItems(items);
        } else {
          toast({
            title: "No items detected",
            description: "Try taking a clearer photo or use manual entry.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Gemini error:", error);
        toast({
          title: "Scan failed",
          description: error.message || "Failed to analyze image with Gemini",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const fetchProductDetailsFromBarcode = async (barcode: string) => {
    setIsLoadingDetails(true);
    try {
      const prompt = `
        For product with barcode "${barcode}":
        Return ONLY valid JSON with these exact fields:
        {
          "name": "Product name (e.g., Coca-Cola 330ml)",
          "category": "one of: ${CATEGORIES.map((c) => c.id).join(", ")}",
          "quantity": 1,
          "unit": "pcs/bottle/can/etc",
          "estimatedPrice": number (USD),
          "expiryDays": number (days from today, 0 if none),
          "description": "short description"
        }
        If unknown, use best guess.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const parsed = parseJsonSafely(responseText);
      if (!parsed) throw new Error("Invalid JSON from Gemini barcode lookup");

      const data = parsed;

      const expiryDate =
        data.expiryDays > 0
          ? new Date(Date.now() + data.expiryDays * 86400000)
              .toISOString()
              .split("T")[0]
          : "";

      const fullDetails: ItemDetails = {
        name: data.name || `Product ${barcode.slice(-6)}`,
        category: (data.category as ItemCategory) || "other",
        quantity: data.quantity || 1,
        unit: data.unit || "pcs",
        price: data.estimatedPrice?.toString() || "",
        expiry_date: expiryDate,
        description: data.description || `Barcode: ${barcode}`,
      };

      const detected: DetectedItem = {
        name: fullDetails.name,
        category: fullDetails.category,
        quantity: fullDetails.quantity,
        unit: fullDetails.unit,
        price: data.estimatedPrice,
        confidence: 100,
      };

      setDetectedItems([detected]);
      setSelectedItem(detected);
      setItemDetails(fullDetails);
    } catch (error: any) {
      const fallback: DetectedItem = {
        name: `Scanned Item (${barcode.slice(-6)})`,
        category: "other",
        quantity: 1,
        unit: "pcs",
        confidence: 95,
      };
      setDetectedItems([fallback]);
      setSelectedItem(fallback);
      setItemDetails({
        name: fallback.name,
        category: "other",
        quantity: 1,
        unit: "pcs",
        price: "",
        expiry_date: "",
        description: `Barcode: ${barcode}`,
      });
      toast({
        title: "Partial success",
        description: "Barcode read but details unavailable. Edit manually.",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAddItem = async (item: DetectedItem) => {
    setSelectedItem(item);
    setIsLoadingDetails(true);

    try {
      const prompt = `
        For the home inventory item named "${item.name}":
        - category: Classify strictly into one of these existing categories: ${CATEGORIES.map(
          (c) => c.id
        ).join(", ")}
        - quantity: Default to ${item.quantity || 1}
        - unit: Appropriate unit (e.g., pcs, kg, ml; default to '${
          item.unit || "pcs"
        }')
        - estimatedPrice: Approximate average price in USD (number only)
        - expiryDays: Estimated days until expiry from now (number; e.g., 7 for perishables, 365 for non-perishables, 0 if none)
        - description: Short description (1-2 sentences)
        Return as JSON object: {"category": "...", "quantity": ..., "unit": "...", "estimatedPrice": ..., "expiryDays": ..., "description": "..."}
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const parsed = parseJsonSafely(responseText);
      if (!parsed) throw new Error("Invalid JSON from details prompt");

      const data = parsed;

      const expiryDate = data.expiryDays
        ? new Date(Date.now() + data.expiryDays * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : "";

      setItemDetails({
        name: item.name,
        category: data.category || (item.category as ItemCategory),
        quantity: data.quantity || item.quantity,
        unit: data.unit || item.unit,
        price: data.estimatedPrice?.toString() || "",
        expiry_date: expiryDate,
        description: data.description || "",
      });
    } catch (error) {
      console.error("Failed to get item details:", error);
      setDefaultItemDetails(item);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const setDefaultItemDetails = (item: DetectedItem) => {
    setItemDetails({
      name: item.name,
      category: item.category as ItemCategory,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price?.toString() || "",
      expiry_date: "",
      description: "",
    });
  };

  const handleConfirmAdd = async () => {
    if (!itemDetails) return;

    setIsAddingItem(true);
    try {
      await createItem.mutateAsync({
        name: itemDetails.name,
        category: itemDetails.category,
        quantity: itemDetails.quantity,
        unit: itemDetails.unit,
        price: itemDetails.price ? parseFloat(itemDetails.price) : undefined,
        expiry_date: itemDetails.expiry_date || undefined,
        notes: itemDetails.description || undefined,
        image_url: getDefaultImageForCategory(itemDetails.category),
      });

      setDetectedItems((prev) =>
        prev.filter((i) => i.name !== selectedItem?.name)
      );
      setSelectedItem(null);
      setItemDetails(null);

      toast({
        title: "Item Added",
        description: `${itemDetails.name} has been added to your inventory.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDismissItem = (item: DetectedItem) => {
    setDetectedItems((prev) => prev.filter((i) => i.name !== item.name));
  };

  const handleAddAll = async () => {
    for (const item of detectedItems) {
      try {
        await createItem.mutateAsync({
          name: item.name,
          category: item.category as ItemCategory,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          image_url: getDefaultImageForCategory(item.category as ItemCategory),
        });
      } catch (error) {
        console.error("Failed to add item:", item.name, error);
      }
    }

    toast({
      title: "All Items Added",
      description: `${detectedItems.length} items have been added to your inventory.`,
    });
    setDetectedItems([]);
  };

  const modes = [
    {
      id: "photo" as ScanMode,
      label: "Photo",
      icon: Camera,
      description: "AI identifies items",
    },
    {
      id: "barcode" as ScanMode,
      label: "Barcode",
      icon: Barcode,
      description: "Scan product codes",
    },
    {
      id: "receipt" as ScanMode,
      label: "Receipt",
      icon: FileText,
      description: "Extract purchases",
    },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* ... entire UI unchanged ... */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            AI-Powered Scanning
          </div>
          <h1 className="text-2xl font-bold">Scan & Add Items</h1>
          <p className="text-muted-foreground">
            Let AI identify items from photos, barcodes, or receipts
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setImagePreview(null);
                setDetectedItems([]);
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                mode === m.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg",
                  mode === m.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                )}
              >
                <m.icon className="h-6 w-6" />
              </div>
              <span className="font-medium">{m.label}</span>
              <span className="text-xs text-muted-foreground">
                {m.description}
              </span>
            </button>
          ))}
        </div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          {imagePreview ? (
            <div className="relative">
              <div className="aspect-video bg-secondary">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
              </div>

              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
                >
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/30" />
                    <Loader2 className="absolute inset-0 m-auto h-10 w-10 animate-spin text-primary" />
                  </div>
                  <p className="mt-4 font-medium">
                    Analyzing with Gemini AI...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {mode === "photo" && "Detecting items in image"}
                    {mode === "barcode" && "Reading barcode data"}
                    {mode === "receipt" && "Extracting purchase information"}
                  </p>
                </motion.div>
              )}

              <Button
                variant="secondary"
                size="sm"
                className="absolute top-3 right-3"
                onClick={() => {
                  setImagePreview(null);
                  setDetectedItems([]);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          ) : (
            <label className="flex aspect-video cursor-pointer flex-col items-center justify-center p-8 hover:bg-muted/50 transition-colors">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <Upload className="h-10 w-10" />
              </div>
              <p className="font-semibold text-lg mb-1">
                {mode === "photo" && "Upload Item Photo"}
                {mode === "barcode" && "Scan Barcode"}
                {mode === "receipt" && "Upload Receipt"}
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                {mode === "photo" &&
                  "Take a photo of your items and AI will identify them automatically"}
                {mode === "barcode" &&
                  "Scan product barcodes for instant item lookup and details"}
                {mode === "receipt" &&
                  "Upload a receipt to automatically extract all purchased items"}
              </p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </motion.div>

        {detectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card"
          >
            <div className="border-b border-border p-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Detected Items ({detectedItems.length})
              </h2>
              <p className="text-sm text-muted-foreground">
                Review and add items to your inventory
              </p>
            </div>

            <div className="divide-y divide-border">
              {detectedItems.map((item, index) => (
                <motion.div
                  key={item.name + index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground capitalize">
                        {item.category}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          item.confidence >= 90
                            ? "bg-success/10 text-success"
                            : item.confidence >= 80
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.confidence}% match
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDismissItem(item)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="gradient-primary text-primary-foreground"
                      onClick={() => handleAddItem(item)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {detectedItems.length > 1 && (
              <div className="border-t border-border p-4">
                <Button
                  className="w-full gradient-primary text-primary-foreground"
                  onClick={handleAddAll}
                >
                  Add All Items
                </Button>
              </div>
            )}
          </motion.div>
        )}

        <Dialog
          open={!!selectedItem}
          onOpenChange={() => {
            setSelectedItem(null);
            setItemDetails(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Item to Inventory</DialogTitle>
            </DialogHeader>

            {isLoadingDetails ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                  Getting item details from Gemini AI...
                </p>
              </div>
            ) : (
              itemDetails && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={itemDetails.name}
                      onChange={(e) =>
                        setItemDetails({ ...itemDetails, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={itemDetails.category}
                        onValueChange={(value: ItemCategory) =>
                          setItemDetails({ ...itemDetails, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                {cat.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={itemDetails.quantity}
                        onChange={(e) =>
                          setItemDetails({
                            ...itemDetails,
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={itemDetails.unit}
                        onChange={(e) =>
                          setItemDetails({
                            ...itemDetails,
                            unit: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={itemDetails.price}
                        onChange={(e) =>
                          setItemDetails({
                            ...itemDetails,
                            price: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={itemDetails.expiry_date}
                      onChange={(e) =>
                        setItemDetails({
                          ...itemDetails,
                          expiry_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description/Notes</Label>
                    <Input
                      id="description"
                      value={itemDetails.description}
                      onChange={(e) =>
                        setItemDetails({
                          ...itemDetails,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedItem(null);
                        setItemDetails(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 gradient-primary text-primary-foreground"
                      onClick={handleConfirmAdd}
                      disabled={isAddingItem}
                    >
                      {isAddingItem ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Add Item
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
