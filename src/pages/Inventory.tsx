import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid3X3, List, Plus, MoreHorizontal, AlertTriangle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryItem, getCategoryInfo, CATEGORIES, ItemCategory } from '@/types/inventory';
import { mockItems } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';

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

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredItems = mockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-muted-foreground">Manage all your household items</p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="gap-2 gradient-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50 border-transparent focus:border-primary/50"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'gradient-primary text-primary-foreground' : ''}
          >
            All Items
          </Button>
          {CATEGORIES.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "gap-1.5",
                selectedCategory === category.id && 'gradient-primary text-primary-foreground'
              )}
            >
              <span>{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>

        {/* Items Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item, index) => (
              <ItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item, index) => (
              <ItemRow key={item.id} item={item} index={index} />
            ))}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">No items found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <AddItemDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </AppLayout>
  );
}

function ItemCard({ item, index }: { item: InventoryItem; index: number }) {
  const category = getCategoryInfo(item.category);
  const expiring = isExpiringSoon(item.expiryDate);
  const lowStock = isLowStock(item.quantity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      {/* Image */}
      <div className="relative aspect-square bg-secondary overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
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
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
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
        <p className="text-sm text-muted-foreground mb-3">{item.location}</p>
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

function ItemRow({ item, index }: { item: InventoryItem; index: number }) {
  const category = getCategoryInfo(item.category);
  const expiring = isExpiringSoon(item.expiryDate);
  const lowStock = isLowStock(item.quantity);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all"
    >
      {/* Image */}
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
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
        <p className="text-sm text-muted-foreground">{item.location}</p>
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
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
