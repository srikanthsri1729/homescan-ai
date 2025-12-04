import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHousehold } from './useHousehold';
import { useItems, ItemCategory } from './useItems';

export interface AnalyticsData {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiringItems: number;
  categoryBreakdown: { name: string; value: number; fill: string }[];
  monthlySpend: { month: string; amount: number }[];
  recentTransactions: { id: string; item_name: string; type: string; delta: number; created_at: string }[];
}

const CATEGORY_COLORS: Record<ItemCategory, string> = {
  food: 'hsl(0, 72%, 51%)',
  beverages: 'hsl(200, 72%, 51%)',
  cleaning: 'hsl(142, 76%, 36%)',
  personal: 'hsl(262, 83%, 58%)',
  medicine: 'hsl(0, 72%, 65%)',
  electronics: 'hsl(220, 72%, 51%)',
  documents: 'hsl(210, 72%, 51%)',
  kitchen: 'hsl(38, 92%, 50%)',
  furniture: 'hsl(30, 72%, 51%)',
  clothing: 'hsl(320, 72%, 51%)',
  office: 'hsl(45, 72%, 51%)',
  other: 'hsl(174, 72%, 40%)',
};

export function useAnalytics() {
  const { currentHousehold } = useHousehold();
  const { items, isLoading: itemsLoading } = useItems();

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', currentHousehold?.id],
    queryFn: async () => {
      if (!currentHousehold) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          items:item_id (name)
        `)
        .eq('household_id', currentHousehold.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentHousehold,
  });

  // Calculate analytics from items
  const analytics: AnalyticsData = {
    totalItems: items?.length || 0,
    totalValue: items?.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0) || 0,
    lowStockItems: items?.filter(item => item.quantity <= item.low_stock_threshold).length || 0,
    expiringItems: items?.filter(item => {
      if (!item.expiry_date) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    }).length || 0,
    categoryBreakdown: calculateCategoryBreakdown(items || []),
    monthlySpend: calculateMonthlySpend(transactions || []),
    recentTransactions: (transactions || []).slice(0, 10).map(t => ({
      id: t.id,
      item_name: (t.items as any)?.name || 'Unknown',
      type: t.type,
      delta: Number(t.delta),
      created_at: t.created_at || '',
    })),
  };

  return {
    analytics,
    isLoading: itemsLoading || transactionsLoading,
  };
}

function calculateCategoryBreakdown(items: any[]): { name: string; value: number; fill: string }[] {
  const counts: Record<string, number> = {};
  
  items.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });

  return Object.entries(counts).map(([category, count]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: count,
    fill: CATEGORY_COLORS[category as ItemCategory] || CATEGORY_COLORS.other,
  }));
}

function calculateMonthlySpend(transactions: any[]): { month: string; amount: number }[] {
  const monthlyTotals: Record<string, number> = {};
  const now = new Date();
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = date.toLocaleDateString('en-US', { month: 'short' });
    monthlyTotals[key] = 0;
  }

  // Sum purchase transactions
  transactions
    .filter(t => t.type === 'purchase')
    .forEach(t => {
      const date = new Date(t.created_at);
      const key = date.toLocaleDateString('en-US', { month: 'short' });
      if (key in monthlyTotals) {
        monthlyTotals[key] += Math.abs(Number(t.delta)) * 10; // Estimate value per unit
      }
    });

  return Object.entries(monthlyTotals).map(([month, amount]) => ({
    month,
    amount,
  }));
}
