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

interface ItemRowProps {
  item: Item;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onConsume: (amount: number) => void;
}

export function ItemRow({ item, index, onEdit, onDelete, onConsume }: ItemRowProps) {
  const category = CATEGORY_INFO[item.category];
  const expiring = isExpiringSoon(item.expiry_date);
  const lowStock = isLowStock(item.quantity, item.low_stock_threshold);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all"
    >
      {/* Image */}
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl">
            {category.icon}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{item.name}</p>
          {expiring && (
            <span className="flex items-center gap-1 text-xs text-warning">
              <Clock className="h-3 w-3" /> Expiring
            </span>
          )}
          {lowStock && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" /> Low
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{item.location || 'No location'}</p>
      </div>

      {/* Quantity */}
      <div className="text-right">
        <p className="font-medium">{item.quantity} {item.unit}</p>
        {item.price && (
          <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
        )}
      </div>

      {/* Category */}
      <div className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        "bg-secondary text-secondary-foreground"
      )}>
        <span>{category.icon}</span>
        <span className="hidden sm:inline">{category.name}</span>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
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
    </motion.div>
  );
}
