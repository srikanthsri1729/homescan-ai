import { useState } from 'react';
import { Search, Filter, Grid3X3, List, Plus, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORIES, ItemCategory } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';
import { EditItemDialog } from '@/components/inventory/EditItemDialog';
import { ItemCard } from '@/components/inventory/ItemCard';
import { ItemRow } from '@/components/inventory/ItemRow';
import { useItems, Item } from '@/hooks/useItems';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Inventory() {
  const { items, isLoading, deleteItem, consumeItem } = useItems();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async () => {
    if (deletingItem) {
      await deleteItem.mutateAsync(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const handleConsume = async (item: Item, amount: number) => {
    await consumeItem.mutateAsync({ id: item.id, amount });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

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
            All Items ({items.length})
          </Button>
          {CATEGORIES.map(category => {
            const count = items.filter(i => i.category === category.id).length;
            return (
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
                {category.name} ({count})
              </Button>
            );
          })}
        </div>

        {/* Items Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item, index) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                index={index}
                onEdit={() => setEditingItem(item)}
                onDelete={() => setDeletingItem(item)}
                onConsume={(amount) => handleConsume(item, amount)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item, index) => (
              <ItemRow 
                key={item.id} 
                item={item} 
                index={index}
                onEdit={() => setEditingItem(item)}
                onDelete={() => setDeletingItem(item)}
                onConsume={(amount) => handleConsume(item, amount)}
              />
            ))}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">No items found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {items.length === 0 
                ? "Start by adding your first item to your inventory" 
                : "Try adjusting your search or filters"}
            </p>
            {items.length === 0 && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2 gradient-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Add Your First Item
              </Button>
            )}
          </div>
        )}
      </div>

      <AddItemDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      
      {editingItem && (
        <EditItemDialog 
          open={!!editingItem} 
          onOpenChange={(open) => !open && setEditingItem(null)} 
          item={editingItem}
        />
      )}

      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
