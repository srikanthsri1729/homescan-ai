import { motion } from 'framer-motion';
import { Camera, Barcode, FileText, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const actions = [
  {
    id: 'scan-photo',
    title: 'Scan Photo',
    description: 'AI identifies items',
    icon: Camera,
    color: 'bg-primary/10 text-primary',
    href: '/scan',
  },
  {
    id: 'scan-barcode',
    title: 'Scan Barcode',
    description: 'Quick item lookup',
    icon: Barcode,
    color: 'bg-chart-2/10 text-chart-2',
    href: '/scan',
  },
  {
    id: 'scan-receipt',
    title: 'Scan Receipt',
    description: 'Auto-add purchases',
    icon: FileText,
    color: 'bg-chart-3/10 text-chart-3',
    href: '/scan',
  },
  {
    id: 'ai-suggest',
    title: 'AI Suggestions',
    description: 'Smart reorder tips',
    icon: Sparkles,
    color: 'bg-chart-4/10 text-chart-4',
    href: '/analytics',
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <p className="text-sm text-muted-foreground">AI-powered shortcuts</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.2 + index * 0.05 }}
            onClick={() => navigate(action.href)}
            className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-left transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
