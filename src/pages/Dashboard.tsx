import { Package, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentItems } from '@/components/dashboard/RecentItems';
import { SpendChart } from '@/components/dashboard/SpendChart';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useItems } from '@/hooks/useItems';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { items, isLoading: itemsLoading } = useItems();
  const { analytics, isLoading: analyticsLoading } = useAnalytics();

  const isLoading = itemsLoading || analyticsLoading;

  // Calculate stats from real data
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const lowStockItems = items.filter(item => item.quantity <= item.low_stock_threshold).length;
  const expiringItems = items.filter(item => {
    if (!item.expiry_date) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  }).length;

  // Recent items (last 5)
  const recentItems = items.slice(0, 5).map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    location: item.location || 'No location',
    imageUrl: item.image_url || undefined,
  }));

  // Category breakdown - ensure correct property names
  const categoryBreakdown = (analytics?.categoryBreakdown || []).map(item => ({
    name: item.name,
    value: item.value,
    color: (item as any).color || (item as any).fill || 'hsl(174 72% 50%)',
  }));
  const monthlySpend = analytics?.monthlySpend || [];

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
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.display_name || user?.email?.split('@')[0] || 'User'}! Here's your inventory overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Items"
            value={totalItems}
            subtitle="Across all categories"
            icon={<Package className="h-6 w-6" />}
            delay={0}
          />
          <StatCard
            title="Total Value"
            value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Inventory worth"
            icon={<DollarSign className="h-6 w-6" />}
            variant="primary"
            delay={0.05}
          />
          <StatCard
            title="Low Stock"
            value={lowStockItems}
            subtitle="Items need restocking"
            icon={<AlertTriangle className="h-6 w-6" />}
            variant="warning"
            delay={0.1}
          />
          <StatCard
            title="Expiring Soon"
            value={expiringItems}
            subtitle="Within 7 days"
            icon={<Clock className="h-6 w-6" />}
            variant="destructive"
            delay={0.15}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SpendChart data={monthlySpend} />
          </div>
          <CategoryBreakdown data={categoryBreakdown} />
        </div>

        {/* Quick Actions & Recent Items */}
        <div className="grid gap-6 lg:grid-cols-3">
          <QuickActions />
          <div className="lg:col-span-2">
            <RecentItems items={recentItems} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
