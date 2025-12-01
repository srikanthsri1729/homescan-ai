import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Clock, AlertTriangle, Check, Trash2, Settings } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'expiry' | 'low-stock' | 'reorder' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'expiry',
    title: 'Expiring Soon',
    message: 'Organic Milk expires in 2 days',
    time: '10 mins ago',
    read: false,
  },
  {
    id: '2',
    type: 'low-stock',
    title: 'Low Stock Alert',
    message: 'Whole Wheat Bread is running low (1 left)',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'reorder',
    title: 'Reorder Suggestion',
    message: 'Based on usage, consider ordering Eggs soon',
    time: '3 hours ago',
    read: false,
  },
  {
    id: '4',
    type: 'expiry',
    title: 'Item Expired',
    message: 'Greek Yogurt has expired',
    time: '1 day ago',
    read: true,
  },
  {
    id: '5',
    type: 'info',
    title: 'Weekly Summary',
    message: 'You added 8 items and used 15 items this week',
    time: '2 days ago',
    read: true,
  },
];

const typeIcons = {
  expiry: Clock,
  'low-stock': AlertTriangle,
  reorder: Bell,
  info: Bell,
};

const typeColors = {
  expiry: 'text-warning bg-warning/10',
  'low-stock': 'text-destructive bg-destructive/10',
  reorder: 'text-primary bg-primary/10',
  info: 'text-muted-foreground bg-muted',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-border bg-card">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No notifications</h3>
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification, index) => {
              const Icon = typeIcons[notification.type];
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-sm",
                    notification.read
                      ? "border-border bg-card"
                      : "border-primary/20 bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                    typeColors[notification.type]
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{notification.title}</p>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
