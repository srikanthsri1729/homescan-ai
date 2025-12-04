import { motion } from 'framer-motion';
import { MoreHorizontal, AlertTriangle, Clock, Edit, Trash2, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Item, ItemCategory } from '@/hooks/useItems';
import { cn } from '@/lib/utils';

const CATEGORY_INFO: Record<ItemCategory, { icon: string; name: string }> = {
  food: { icon: '🍎', name: 'Food' },
  beverages: { icon: '🥤', name: 'Beverages' },
  cleaning: { icon: '🧹', name: 'Cleaning' },
  personal: { icon: '🧴', name: 'Personal' },
  medicine: { icon: '💊', name: 'Medicine' },
  electronics: { icon: '📱', name: 'Electronics' },
  documents: { icon: '📄', name: 'Documents' },
  kitchen: { icon: '🍳', name: 'Kitchen' },
  furniture: { icon: '🛋️', name: 'Furniture' },
  clothing: { icon: '👕', name: 'Clothing' },
  office: { icon: '📎', name: 'Office' },
  other: { icon: '📦', name: 'Other' },
};

function isExpiringSoon(expiryDate?: string | null): boolean {
  if (!expiryDate) return false;
  const daysUntilExpiry = Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
}

function isLowStock(quantity: number, threshold: number): boolean {
  return quantity <= threshold;
}

interface ItemCardProps {
  item: Item;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onConsume: (amount: number) => void;
}

export function ItemCard({ item, index, onEdit, onDelete, onConsume }: ItemCardProps) {
  const category = CATEGORY_INFO[item.category];
  const expiring = isExpiringSoon(item.expiry_date);
  const lowStock = isLowStock(item.quantity, item.low_stock_threshold);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      {/* Image */}
      <div className="relative aspect-square bg-secondary overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            {category.icon}
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {expiring && (
            <span className="flex items-center gap-1 rounded-full bg-warning/90 px-2 py-0.5 text-xs font-medium text-warning-foreground">
              <Clock className="h-3 w-3" />
              Expiring
            </span>
          )}
          {lowStock && (
            <span className="flex items-center gap-1 rounded-full bg-destructive/90 px-2 py-0.5 text-xs font-medium text-destructive-foreground">
              <AlertTriangle className="h-3 w-3" />
              Low Stock
            </span>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onConsume(1)}>
              <Minus className="mr-2 h-4 w-4" />
              Use 1
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold leading-tight">{item.name}</h3>
          <span className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            "bg-secondary text-secondary-foreground"
          )}>
            {category.icon}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{item.location || 'No location'}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {item.quantity} {item.unit}
          </span>
          {item.price && (
            <span className="text-sm text-muted-foreground">
              ${item.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
