import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Upload, Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddItemDialog({ open, onOpenChange }: AddItemDialogProps) {
  const [step, setStep] = useState<'choose' | 'scan' | 'manual'>('choose');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsAnalyzing(true);
        // Simulate AI analysis
        setTimeout(() => {
          setIsAnalyzing(false);
          toast({
            title: "AI Analysis Complete",
            description: "Item detected: Organic Milk (Beverages)",
          });
        }, 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('choose');
      setImagePreview(null);
      setIsAnalyzing(false);
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Item Added",
      description: "Your item has been added to inventory.",
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'choose' && 'Add New Item'}
            {step === 'scan' && (
              <>
                <Sparkles className="h-5 w-5 text-primary" />
                AI Scan
              </>
            )}
            {step === 'manual' && 'Manual Entry'}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-4 py-4"
            >
              <button
                onClick={() => setStep('scan')}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Scan with AI</p>
                  <p className="text-sm text-muted-foreground">
                    Take a photo and let AI identify the item
                  </p>
                </div>
                <Sparkles className="ml-auto h-5 w-5 text-primary" />
              </button>

              <button
                onClick={() => setStep('manual')}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Manual Entry</p>
                  <p className="text-sm text-muted-foreground">
                    Add item details manually
                  </p>
                </div>
              </button>
            </motion.div>
          )}

          {step === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 py-4"
            >
              {/* Image Upload Area */}
              <div className="relative">
                {imagePreview ? (
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-secondary">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p className="text-sm font-medium">Analyzing image...</p>
                        <p className="text-xs text-muted-foreground">AI is identifying items</p>
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setImagePreview(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/50 hover:border-primary/50 hover:bg-secondary transition-all">
                    <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="font-medium">Take or upload a photo</p>
                    <p className="text-sm text-muted-foreground">AI will identify the item</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('choose')}>
                  Back
                </Button>
                <Button 
                  className="flex-1 gradient-primary text-primary-foreground" 
                  disabled={!imagePreview || isAnalyzing}
                  onClick={() => setStep('manual')}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'manual' && (
            <motion.form
              key="manual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 py-4"
              onSubmit={handleSubmit}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" placeholder="e.g., Organic Milk" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select defaultValue="food">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" min="1" defaultValue="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" placeholder="e.g., liters" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" type="number" step="0.01" placeholder="0.00" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="e.g., Refrigerator" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input id="expiry" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Any additional notes..." rows={2} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('choose')}>
                  Back
                </Button>
                <Button type="submit" className="flex-1 gradient-primary text-primary-foreground">
                  Add Item
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
