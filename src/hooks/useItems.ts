import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from './useHousehold';
import { toast } from '@/hooks/use-toast';

export type ItemCategory = 'food' | 'beverages' | 'cleaning' | 'personal' | 'medicine' | 'electronics' | 'documents' | 'kitchen' | 'furniture' | 'clothing' | 'office' | 'other';

export interface Item {
  id: string;
  household_id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  location: string | null;
  purchase_date: string | null;
  expiry_date: string | null;
  price: number | null;
  barcode: string | null;
  notes: string | null;
  image_url: string | null;
  low_stock_threshold: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateItemData {
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  location?: string;
  purchase_date?: string;
  expiry_date?: string;
  price?: number;
  barcode?: string;
  notes?: string;
  image_url?: string;
  low_stock_threshold?: number;
}

export function useItems() {
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();
  const queryClient = useQueryClient();

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['items', currentHousehold?.id],
    queryFn: async () => {
      if (!currentHousehold) return [];
      
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('household_id', currentHousehold.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Item[];
    },
    enabled: !!currentHousehold,
  });

  const createItem = useMutation({
    mutationFn: async (itemData: CreateItemData) => {
      if (!currentHousehold || !user) throw new Error('No household selected');
      
      const { data, error } = await supabase
        .from('items')
        .insert({
          ...itemData,
          household_id: currentHousehold.id,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create a purchase transaction
      await supabase.from('transactions').insert({
        item_id: data.id,
        household_id: currentHousehold.id,
        delta: itemData.quantity,
        type: 'purchase',
        created_by: user.id,
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({ title: 'Item added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding item', description: error.message, variant: 'destructive' });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Item> & { id: string }) => {
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({ title: 'Item updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating item', description: error.message, variant: 'destructive' });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({ title: 'Item deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting item', description: error.message, variant: 'destructive' });
    },
  });

  const consumeItem = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      if (!currentHousehold || !user) throw new Error('No household selected');
      
      const item = items?.find(i => i.id === id);
      if (!item) throw new Error('Item not found');
      
      const newQuantity = Math.max(0, item.quantity - amount);
      
      // Update item quantity
      const { error: updateError } = await supabase
        .from('items')
        .update({ quantity: newQuantity })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Create use transaction
      await supabase.from('transactions').insert({
        item_id: id,
        household_id: currentHousehold.id,
        delta: -amount,
        type: 'use',
        created_by: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({ title: 'Item consumed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    items: items || [],
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
    consumeItem,
  };
}
