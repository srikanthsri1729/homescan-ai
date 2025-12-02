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
  food: 'hsl(var(--chart-1))',
  beverages: 'hsl(var(--chart-2))',
  cleaning: 'hsl(var(--chart-3))',
  personal: 'hsl(var(--chart-4))',
  medicine: 'hsl(var(--chart-5))',
  electronics: 'hsl(142, 76%, 36%)',
  documents: 'hsl(45, 93%, 47%)',
  other: 'hsl(var(--muted-foreground))',
};

export function useAnalytics() {
  const { currentHousehold } = useHousehold();
  const { items } = useItems();

  const { data: transactions } = useQuery({
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
    totalItems: items.length,
    totalValue: items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
    lowStockItems: items.filter(item => item.quantity <= item.low_stock_threshold).length,
    expiringItems: items.filter(item => {
      if (!item.expiry_date) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    }).length,
    categoryBreakdown: calculateCategoryBreakdown(items),
    monthlySpend: calculateMonthlySpend(transactions || []),
    recentTransactions: (transactions || []).slice(0, 10).map(t => ({
      id: t.id,
      item_name: t.items?.name || 'Unknown',
      type: t.type,
      delta: t.delta,
      created_at: t.created_at,
    })),
  };

  return {
    analytics,
    isLoading: !items,
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
        monthlyTotals[key] += Math.abs(t.delta) * 10; // Estimate value per unit
      }
    });

  return Object.entries(monthlyTotals).map(([month, amount]) => ({
    month,
    amount,
  }));
}
