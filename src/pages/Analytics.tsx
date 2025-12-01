import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Sparkles } from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { mockAnalytics } from '@/data/mockData';

const COLORS = [
  'hsl(174 72% 50%)',
  'hsl(262 83% 58%)',
  'hsl(38 92% 50%)',
  'hsl(142 76% 36%)',
  'hsl(0 72% 51%)',
  'hsl(200 72% 51%)',
  'hsl(320 72% 51%)',
];

const usageData = [
  { name: 'Milk', used: 12, remaining: 2 },
  { name: 'Bread', used: 8, remaining: 1 },
  { name: 'Eggs', used: 24, remaining: 6 },
  { name: 'Yogurt', used: 10, remaining: 4 },
  { name: 'Cleaner', used: 3, remaining: 3 },
];

const predictions = [
  { item: 'Organic Milk', daysLeft: 3, action: 'Reorder soon' },
  { item: 'Bread', daysLeft: 2, action: 'Running low' },
  { item: 'Shampoo', daysLeft: 7, action: 'Monitor usage' },
];

export default function Analytics() {
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
              <div className="flex items-center gap-1 text-success text-xs font-medium">
                <TrendingDown className="h-3 w-3" />
                -12%
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">${mockAnalytics.monthlySpend[5].spend}</p>
            <p className="text-xs text-muted-foreground mt-1">vs ${mockAnalytics.monthlySpend[4].spend} last month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Avg per Item</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">$27.72</p>
            <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
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
            <p className="text-2xl font-bold mt-2">{mockAnalytics.totalItems}</p>
            <p className="text-xs text-muted-foreground mt-1">+5 this week</p>
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
            <p className="text-2xl font-bold mt-2">{mockAnalytics.lowStockItems + mockAnalytics.expiringItems}</p>
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockAnalytics.monthlySpend}>
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
                  <Area type="monotone" dataKey="spend" stroke="hsl(174 72% 50%)" strokeWidth={2} fill="url(#spendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockAnalytics.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="category"
                  >
                    {mockAnalytics.categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <p className="text-sm text-muted-foreground mb-4">Most used items this month</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="used" fill="hsl(174 72% 50%)" radius={[0, 4, 4, 0]} name="Used" />
                  <Bar dataKey="remaining" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} name="Remaining" />
                </BarChart>
              </ResponsiveContainer>
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
            <p className="text-sm text-muted-foreground mb-4">Smart reorder suggestions</p>

            <div className="space-y-4">
              {predictions.map((pred, index) => (
                <div
                  key={pred.item}
                  className="flex items-center gap-4 rounded-lg border border-border bg-background p-4"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm ${
                    pred.daysLeft <= 3 ? 'bg-destructive/10 text-destructive' :
                    pred.daysLeft <= 5 ? 'bg-warning/10 text-warning' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {pred.daysLeft}d
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
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Based on your usage patterns and historical data
            </p>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
