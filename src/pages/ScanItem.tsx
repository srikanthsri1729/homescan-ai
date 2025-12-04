import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Barcode, FileText, Upload, Sparkles, Loader2, Check, X, Edit2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useItems, ItemCategory } from '@/hooks/useItems';
import { CATEGORIES, getDefaultImageForCategory } from '@/types/inventory';

type ScanMode = 'photo' | 'barcode' | 'receipt';

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
  const [mode, setMode] = useState<ScanMode>('photo');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DetectedItem | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setImagePreview(base64Image);
        setIsAnalyzing(true);
        setDetectedItems([]);
        
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-item`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              image: base64Image,
              mode: mode,
            }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to analyze image');
          }
          
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            setDetectedItems(data.items.map((item: any) => ({
              name: item.name,
              category: item.category,
              quantity: item.quantity || 1,
              unit: item.unit || 'pcs',
              price: item.price,
              confidence: item.confidence || 80,
            })));
          } else {
            toast({
              title: 'No items detected',
              description: 'Try taking a clearer photo or use manual entry.',
              variant: 'destructive',
            });
          }
        } catch (error: any) {
          console.error('Scan error:', error);
          toast({
            title: 'Scan failed',
            description: error.message || 'Failed to analyze image',
            variant: 'destructive',
          });
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async (item: DetectedItem) => {
    setSelectedItem(item);
    setIsLoadingDetails(true);
    
    try {
      // Get detailed info from AI
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ itemName: item.name }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.itemDetails) {
          const expiryDate = data.itemDetails.expiryDays 
            ? new Date(Date.now() + data.itemDetails.expiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : '';
          
          setItemDetails({
            name: data.itemDetails.name || item.name,
            category: data.itemDetails.category || item.category as ItemCategory,
            quantity: item.quantity,
            unit: data.itemDetails.unit || item.unit,
            price: data.itemDetails.estimatedPrice?.toString() || '',
            expiry_date: expiryDate,
            description: data.itemDetails.description || '',
          });
        } else {
          setDefaultItemDetails(item);
        }
      } else {
        setDefaultItemDetails(item);
      }
    } catch (error) {
      console.error('Failed to get item details:', error);
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
      price: item.price?.toString() || '',
      expiry_date: '',
      description: '',
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
      
      // Remove item from detected list
      setDetectedItems(prev => prev.filter(i => i.name !== selectedItem?.name));
      setSelectedItem(null);
      setItemDetails(null);
      
      toast({
        title: 'Item Added',
        description: `${itemDetails.name} has been added to your inventory.`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to add item',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDismissItem = (item: DetectedItem) => {
    setDetectedItems(prev => prev.filter(i => i.name !== item.name));
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
        console.error('Failed to add item:', item.name, error);
      }
    }
    
    toast({
      title: 'All Items Added',
      description: `${detectedItems.length} items have been added to your inventory.`,
    });
    setDetectedItems([]);
  };

  const modes = [
    { id: 'photo' as ScanMode, label: 'Photo', icon: Camera, description: 'AI identifies items' },
    { id: 'barcode' as ScanMode, label: 'Barcode', icon: Barcode, description: 'Scan product codes' },
    { id: 'receipt' as ScanMode, label: 'Receipt', icon: FileText, description: 'Extract purchases' },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Page Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            AI-Powered Scanning
          </div>
          <h1 className="text-2xl font-bold">Scan & Add Items</h1>
          <p className="text-muted-foreground">Let AI identify items from photos, barcodes, or receipts</p>
        </div>

        {/* Mode Selector */}
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
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg",
                mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary"
              )}>
                <m.icon className="h-6 w-6" />
              </div>
              <span className="font-medium">{m.label}</span>
              <span className="text-xs text-muted-foreground">{m.description}</span>
            </button>
          ))}
        </div>

        {/* Upload Area */}
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
                  <p className="mt-4 font-medium">Analyzing with AI...</p>
                  <p className="text-sm text-muted-foreground">
                    {mode === 'photo' && 'Detecting items in image'}
                    {mode === 'barcode' && 'Reading barcode data'}
                    {mode === 'receipt' && 'Extracting purchase information'}
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
                {mode === 'photo' && 'Upload Item Photo'}
                {mode === 'barcode' && 'Scan Barcode'}
                {mode === 'receipt' && 'Upload Receipt'}
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                {mode === 'photo' && 'Take a photo of your items and AI will identify them automatically'}
                {mode === 'barcode' && 'Scan product barcodes for instant item lookup and details'}
                {mode === 'receipt' && 'Upload a receipt to automatically extract all purchased items'}
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

        {/* Detected Items */}
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
              <p className="text-sm text-muted-foreground">Review and add items to your inventory</p>
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
                      <span className="text-sm text-muted-foreground capitalize">{item.category}</span>
                      <span className="text-sm text-muted-foreground">{item.quantity} {item.unit}</span>
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        item.confidence >= 90 ? "bg-success/10 text-success" :
                        item.confidence >= 80 ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      )}>
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

        {/* Item Details Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => { setSelectedItem(null); setItemDetails(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Item to Inventory</DialogTitle>
            </DialogHeader>
            
            {isLoadingDetails ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Getting item details from AI...</p>
              </div>
            ) : itemDetails && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input 
                    id="name" 
                    value={itemDetails.name}
                    onChange={(e) => setItemDetails({ ...itemDetails, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={itemDetails.category}
                      onValueChange={(value: ItemCategory) => setItemDetails({ ...itemDetails, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
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
                      onChange={(e) => setItemDetails({ ...itemDetails, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input 
                      id="unit" 
                      value={itemDetails.unit}
                      onChange={(e) => setItemDetails({ ...itemDetails, unit: e.target.value })}
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
                      onChange={(e) => setItemDetails({ ...itemDetails, price: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input 
                    id="expiry" 
                    type="date"
                    value={itemDetails.expiry_date}
                    onChange={(e) => setItemDetails({ ...itemDetails, expiry_date: e.target.value })}
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => { setSelectedItem(null); setItemDetails(null); }}
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
