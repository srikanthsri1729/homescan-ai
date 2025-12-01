import { Package, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentItems } from '@/components/dashboard/RecentItems';
import { SpendChart } from '@/components/dashboard/SpendChart';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { mockItems, mockAnalytics } from '@/data/mockData';

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your inventory overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Items"
            value={mockAnalytics.totalItems}
            subtitle="Across all categories"
            icon={<Package className="h-6 w-6" />}
            trend={{ value: 12, isPositive: true }}
            delay={0}
          />
          <StatCard
            title="Total Value"
            value={`$${mockAnalytics.totalValue.toLocaleString()}`}
            subtitle="Inventory worth"
            icon={<DollarSign className="h-6 w-6" />}
            variant="primary"
            delay={0.05}
          />
          <StatCard
            title="Low Stock"
            value={mockAnalytics.lowStockItems}
            subtitle="Items need restocking"
            icon={<AlertTriangle className="h-6 w-6" />}
            variant="warning"
            delay={0.1}
          />
          <StatCard
            title="Expiring Soon"
            value={mockAnalytics.expiringItems}
            subtitle="Within 7 days"
            icon={<Clock className="h-6 w-6" />}
            variant="destructive"
            delay={0.15}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SpendChart data={mockAnalytics.monthlySpend} />
          </div>
          <CategoryBreakdown data={mockAnalytics.categoryBreakdown} />
        </div>

        {/* Quick Actions & Recent Items */}
        <div className="grid gap-6 lg:grid-cols-3">
          <QuickActions />
          <div className="lg:col-span-2">
            <RecentItems items={mockItems.slice(0, 5)} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
