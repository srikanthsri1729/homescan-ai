import { motion } from 'framer-motion';
import { MoreHorizontal, AlertTriangle, Clock } from 'lucide-react';
import { getCategoryInfo, ItemCategory } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RecentItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  location: string;
  imageUrl?: string;
  expiryDate?: string;
}

interface RecentItemsProps {
  items: RecentItem[];
}

function isExpiringSoon(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const daysUntilExpiry = Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
}

function isLowStock(quantity: number): boolean {
  return quantity <= 2;
}

export function RecentItems({ items }: RecentItemsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h2 className="text-lg font-semibold">Recent Items</h2>
          <p className="text-sm text-muted-foreground">Your recently added inventory</p>
        </div>
        <Button variant="ghost" size="sm">View All</Button>
      </div>

      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No items yet. Start by adding your first item!
          </div>
        ) : (
          items.map((item, index) => {
            const category = getCategoryInfo(item.category);
            const expiring = isExpiringSoon(item.expiryDate);
            const lowStock = isLowStock(item.quantity);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Image */}
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
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
                        <Clock className="h-3 w-3" />
                        Expiring
                      </span>
                    )}
                    {lowStock && (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        Low
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit} • {item.location}
                  </p>
                </div>

                {/* Category Badge */}
                <div className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  "bg-secondary text-secondary-foreground"
                )}>
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </div>

                {/* Actions */}
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
