import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Barcode, FileText, Upload, Sparkles, Loader2, Check, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type ScanMode = 'photo' | 'barcode' | 'receipt';

interface DetectedItem {
  name: string;
  category: string;
  confidence: number;
}

export default function ScanItem() {
  const [mode, setMode] = useState<ScanMode>('photo');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsAnalyzing(true);
        setDetectedItems([]);
        
        // Simulate AI analysis
        setTimeout(() => {
          setIsAnalyzing(false);
          if (mode === 'photo') {
            setDetectedItems([
              { name: 'Organic Milk', category: 'Beverages', confidence: 95 },
              { name: 'Greek Yogurt', category: 'Food', confidence: 88 },
            ]);
          } else if (mode === 'barcode') {
            setDetectedItems([
              { name: 'Whole Wheat Bread', category: 'Food', confidence: 99 },
            ]);
          } else {
            setDetectedItems([
              { name: 'Organic Milk 2L', category: 'Beverages', confidence: 92 },
              { name: 'Free Range Eggs (12)', category: 'Food', confidence: 89 },
              { name: 'Avocados (3 pack)', category: 'Food', confidence: 87 },
              { name: 'All-Purpose Cleaner', category: 'Cleaning', confidence: 94 },
            ]);
          }
        }, 2500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = (item: DetectedItem) => {
    toast({
      title: "Item Added",
      description: `${item.name} has been added to your inventory.`,
    });
    setDetectedItems(prev => prev.filter(i => i.name !== item.name));
  };

  const handleDismissItem = (item: DetectedItem) => {
    setDetectedItems(prev => prev.filter(i => i.name !== item.name));
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
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground">{item.category}</span>
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        item.confidence >= 90 ? "bg-success/10 text-success" :
                        item.confidence >= 80 ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {item.confidence}% confidence
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
                      <Check className="h-4 w-4 mr-1" />
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
                  onClick={() => {
                    toast({
                      title: "All Items Added",
                      description: `${detectedItems.length} items have been added to your inventory.`,
                    });
                    setDetectedItems([]);
                  }}
                >
                  Add All Items
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
