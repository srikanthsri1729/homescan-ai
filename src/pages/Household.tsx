import { motion } from 'framer-motion';
import { Users, Crown, UserPlus, Mail, MoreHorizontal, Shield, Edit2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const members = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'owner',
    avatar: 'JD',
    color: 'bg-primary',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'admin',
    avatar: 'JS',
    color: 'bg-chart-2',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'member',
    avatar: 'MJ',
    color: 'bg-chart-3',
  },
];

const roleLabels = {
  owner: { label: 'Owner', icon: Crown, color: 'text-warning' },
  admin: { label: 'Admin', icon: Shield, color: 'text-primary' },
  member: { label: 'Member', icon: Users, color: 'text-muted-foreground' },
};

export default function Household() {
  const handleInvite = () => {
    toast({
      title: 'Invitation Sent',
      description: 'An invite has been sent to the email address.',
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Household</h1>
            <p className="text-muted-foreground">Manage your shared inventory access</p>
          </div>
        </div>

        {/* Household Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl gradient-primary text-2xl font-bold text-primary-foreground">
                🏠
              </div>
              <div>
                <h2 className="text-xl font-semibold">Home Inventory</h2>
                <p className="text-sm text-muted-foreground">Created Dec 1, 2024 • 3 members</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </motion.div>

        {/* Invite Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="font-semibold mb-1">Invite Members</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share access to your inventory with family members
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Enter email address" className="pl-10" />
            </div>
            <Button className="gradient-primary text-primary-foreground" onClick={handleInvite}>
              <UserPlus className="h-4 w-4 mr-1" />
              Invite
            </Button>
          </div>
        </motion.div>

        {/* Members List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card"
        >
          <div className="border-b border-border p-5">
            <h3 className="font-semibold">Members ({members.length})</h3>
            <p className="text-sm text-muted-foreground">People with access to this inventory</p>
          </div>

          <div className="divide-y divide-border">
            {members.map((member, index) => {
              const roleInfo = roleLabels[member.role as keyof typeof roleLabels];
              const RoleIcon = roleInfo.icon;

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className="flex items-center gap-4 p-4"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${member.color} text-sm font-medium text-primary-foreground`}>
                    {member.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name}</p>
                      {member.role === 'owner' && (
                        <Crown className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                  </div>

                  <div className={`flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium ${roleInfo.color}`}>
                    <RoleIcon className="h-3 w-3" />
                    {roleInfo.label}
                  </div>

                  {member.role !== 'owner' && (
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Permissions Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-border bg-muted/50 p-5"
        >
          <h3 className="font-semibold mb-3">Role Permissions</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-warning">
                <Crown className="h-4 w-4" />
                Owner
              </div>
              <p className="text-xs text-muted-foreground">Full access, manage members, delete household</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Shield className="h-4 w-4" />
                Admin
              </div>
              <p className="text-xs text-muted-foreground">Add/edit items, invite members</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Member
              </div>
              <p className="text-xs text-muted-foreground">View and add items only</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
