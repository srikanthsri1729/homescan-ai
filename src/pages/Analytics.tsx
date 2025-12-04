import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useItems } from '@/hooks/useItems';

const COLORS = [
  'hsl(174 72% 50%)',
  'hsl(262 83% 58%)',
  'hsl(38 92% 50%)',
  'hsl(142 76% 36%)',
  'hsl(0 72% 51%)',
  'hsl(200 72% 51%)',
  'hsl(320 72% 51%)',
  'hsl(45 72% 51%)',
  'hsl(30 72% 51%)',
];

export default function Analytics() {
  const { analytics, isLoading } = useAnalytics();
  const { items } = useItems();

  // Calculate predictions based on real data
  const predictions = items
    .filter(item => {
      const daysUntilExpiry = item.expiry_date 
        ? Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
      return item.quantity <= item.low_stock_threshold || (daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0);
    })
    .slice(0, 5)
    .map(item => {
      const daysUntilExpiry = item.expiry_date 
        ? Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
      
      if (daysUntilExpiry !== null && daysUntilExpiry <= 7) {
        return {
          item: item.name,
          daysLeft: daysUntilExpiry,
          action: daysUntilExpiry <= 0 ? 'Expired!' : daysUntilExpiry <= 3 ? 'Expiring soon' : 'Monitor expiry',
        };
      }
      return {
        item: item.name,
        daysLeft: item.quantity,
        action: item.quantity === 0 ? 'Out of stock' : 'Running low',
      };
    });

  // Calculate usage data from items
  const usageData = items
    .slice(0, 5)
    .map(item => ({
      name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
      used: Math.max(0, item.low_stock_threshold * 2 - item.quantity),
      remaining: item.quantity,
    }));

  // Get current and previous month spend
  const currentMonthSpend = analytics.monthlySpend[analytics.monthlySpend.length - 1]?.amount || 0;
  const prevMonthSpend = analytics.monthlySpend[analytics.monthlySpend.length - 2]?.amount || 0;
  const spendChange = prevMonthSpend > 0 
    ? Math.round(((currentMonthSpend - prevMonthSpend) / prevMonthSpend) * 100) 
    : 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
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
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Insights and predictions for your inventory</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">This Month</p>
              {spendChange !== 0 && (
                <div className={`flex items-center gap-1 text-xs font-medium ${spendChange < 0 ? 'text-success' : 'text-destructive'}`}>
                  {spendChange < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {Math.abs(spendChange)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold mt-2">${currentMonthSpend.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">vs ${prevMonthSpend.toFixed(0)} last month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">${analytics.totalValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all items</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Items Tracked</p>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{analytics.totalItems}</p>
            <p className="text-xs text-muted-foreground mt-1">In your inventory</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-warning/20 bg-warning/5 p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-warning">Needs Attention</p>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <p className="text-2xl font-bold mt-2">{analytics.lowStockItems + analytics.expiringItems}</p>
            <p className="text-xs text-muted-foreground mt-1">Low stock + expiring</p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Spending Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="text-lg font-semibold mb-1">Spending Trend</h2>
            <p className="text-sm text-muted-foreground mb-4">6-month overview</p>
            <div className="h-64">
              {analytics.monthlySpend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthlySpend}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(174 72% 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(174 72% 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                    <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`$${value}`, 'Spent']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="hsl(174 72% 50%)" strokeWidth={2} fill="url(#spendGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No spending data yet
                </div>
              )}
            </div>
          </motion.div>

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="text-lg font-semibold mb-1">Category Distribution</h2>
            <p className="text-sm text-muted-foreground mb-4">Items by category</p>
            <div className="h-64">
              {analytics.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {analytics.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No items yet
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Usage & Predictions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Usage Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="text-lg font-semibold mb-1">Usage Breakdown</h2>
            <p className="text-sm text-muted-foreground mb-4">Item stock levels</p>
            <div className="h-64">
              {usageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="remaining" fill="hsl(174 72% 50%)" radius={[0, 4, 4, 0]} name="Remaining" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No items yet
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Predictions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">AI Predictions</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Smart alerts based on your inventory</p>

            <div className="space-y-4">
              {predictions.length > 0 ? (
                predictions.map((pred) => (
                  <div
                    key={pred.item}
                    className="flex items-center gap-4 rounded-lg border border-border bg-background p-4"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm ${
                      pred.daysLeft <= 3 ? 'bg-destructive/10 text-destructive' :
                      pred.daysLeft <= 5 ? 'bg-warning/10 text-warning' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {pred.daysLeft}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{pred.item}</p>
                      <p className="text-sm text-muted-foreground">{pred.action}</p>
                    </div>
                    <TrendingUp className={`h-4 w-4 ${
                      pred.daysLeft <= 3 ? 'text-destructive' :
                      pred.daysLeft <= 5 ? 'text-warning' :
                      'text-muted-foreground'
                    }`} />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">All items are well-stocked!</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Based on your inventory data and stock levels
            </p>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
