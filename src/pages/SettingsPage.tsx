import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Lock, Palette, Download, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useItems } from '@/hooks/useItems';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const settingsSections = [
  {
    id: 'profile',
    title: 'Profile',
    icon: User,
    description: 'Manage your account information',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Configure alerts and reminders',
  },
  {
    id: 'security',
    title: 'Security',
    icon: Lock,
    description: 'Password and authentication',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Theme and display preferences',
  },
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, settings, updateProfile, updateSettings, isLoading } = useProfile();
  const { items } = useItems();
  
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update local state when profile loads
  if (profile && !displayName && profile.display_name) {
    setDisplayName(profile.display_name);
  }
  if (profile && !email && (profile.email || user?.email)) {
    setEmail(profile.email || user?.email || '');
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        email: email,
      });
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    // Export items as CSV
    const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Location', 'Price', 'Expiry Date', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        `"${item.name}"`,
        item.category,
        item.quantity,
        item.unit,
        `"${item.location || ''}"`,
        item.price || '',
        item.expiry_date || '',
        `"${item.notes || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Your inventory data has been exported as CSV.',
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Delete all user data first
      if (user) {
        // Delete user's notifications
        await supabase.from('notifications').delete().eq('user_id', user.id);
        // Delete user's settings
        await supabase.from('user_settings').delete().eq('user_id', user.id);
        // Delete user's profile
        await supabase.from('profiles').delete().eq('user_id', user.id);
        // Delete user's roles
        await supabase.from('user_roles').delete().eq('user_id', user.id);
      }
      
      // Sign out
      await signOut();
      toast({
        title: 'Account Deleted',
        description: 'Your account has been deleted successfully.',
      });
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSettingToggle = async (key: string, value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update setting.',
        variant: 'destructive',
      });
    }
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
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Quick Links */}
        <div className="grid gap-3 sm:grid-cols-2">
          {settingsSections.map((section, index) => (
            <motion.button
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <section.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{section.title}</p>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {(displayName || email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{displayName || 'Set your name'}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Expiry Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified before items expire</p>
              </div>
              <Switch 
                checked={settings?.expiry_alerts ?? true}
                onCheckedChange={(checked) => handleSettingToggle('expiry_alerts', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">Alert when items are running low</p>
              </div>
              <Switch 
                checked={settings?.low_stock_alerts ?? true}
                onCheckedChange={(checked) => handleSettingToggle('low_stock_alerts', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Summary</p>
                <p className="text-sm text-muted-foreground">Receive weekly inventory reports</p>
              </div>
              <Switch 
                checked={settings?.weekly_summary ?? false}
                onCheckedChange={(checked) => handleSettingToggle('weekly_summary', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch 
                checked={settings?.email_notifications ?? true}
                onCheckedChange={(checked) => handleSettingToggle('email_notifications', checked)}
              />
            </div>
          </div>
        </motion.div>

        {/* Data Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Data Management</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-muted-foreground">Download your inventory as CSV ({items.length} items)</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Account'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            className="gradient-primary text-primary-foreground" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
