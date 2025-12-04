import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, UserPlus, Mail, MoreHorizontal, Shield, Edit2, Trash2, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useHousehold } from '@/hooks/useHousehold';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';

type HouseholdRole = 'owner' | 'admin' | 'member';

const roleLabels = {
  owner: { label: 'Owner', icon: Crown, color: 'text-warning' },
  admin: { label: 'Admin', icon: Shield, color: 'text-primary' },
  member: { label: 'Member', icon: Users, color: 'text-muted-foreground' },
};

const rolePermissions = {
  owner: [
    'Full access to all features',
    'Manage all household members',
    'Delete the household',
    'Transfer ownership',
    'Add, edit, and delete all items',
  ],
  admin: [
    'Add, edit, and delete items',
    'Invite new members',
    'Remove regular members',
    'View all analytics',
  ],
  member: [
    'View inventory items',
    'Add new items',
    'Edit own items',
    'View basic analytics',
  ],
};

export default function Household() {
  const { user } = useAuth();
  const { 
    currentHousehold, 
    members, 
    isLoading, 
    userRole, 
    inviteMember, 
    updateMemberRole, 
    removeMember 
  } = useHousehold();
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [memberToChangeRole, setMemberToChangeRole] = useState<{ id: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: 'Please enter an email address', variant: 'destructive' });
      return;
    }

    setIsInviting(true);
    try {
      await inviteMember.mutateAsync({ email: inviteEmail, role: 'member' });
      setInviteEmail('');
      toast({
        title: 'Invitation Sent',
        description: 'An invite has been sent to the email address.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to invite',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      await removeMember.mutateAsync(memberToRemove);
      toast({ title: 'Member removed successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to remove member', description: error.message, variant: 'destructive' });
    } finally {
      setMemberToRemove(null);
    }
  };

  const handleChangeRole = async () => {
    if (!memberToChangeRole) return;
    
    try {
      await updateMemberRole.mutateAsync({ memberId: memberToChangeRole.id, role: newRole });
      toast({ title: 'Role updated successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to update role', description: error.message, variant: 'destructive' });
    } finally {
      setMemberToChangeRole(null);
    }
  };

  const canManageMembers = userRole === 'owner' || userRole === 'admin';
  const canChangeRoles = userRole === 'owner';

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
                <h2 className="text-xl font-semibold">{currentHousehold?.name || 'My Home'}</h2>
                <p className="text-sm text-muted-foreground">
                  Created {currentHousehold?.created_at 
                    ? formatDistanceToNow(new Date(currentHousehold.created_at), { addSuffix: true })
                    : 'recently'
                  } • {members.length} member{members.length !== 1 ? 's' : ''}
                </p>
                {currentHousehold?.description && (
                  <p className="text-sm text-muted-foreground mt-1">{currentHousehold.description}</p>
                )}
              </div>
            </div>
            {userRole === 'owner' && (
              <Button variant="outline" size="sm">
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </motion.div>

        {/* Invite Members - Only for owners and admins */}
        {canManageMembers && (
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
                <Input 
                  placeholder="Enter email address" 
                  className="pl-10" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
              </div>
              <Button 
                className="gradient-primary text-primary-foreground" 
                onClick={handleInvite}
                disabled={isInviting}
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-1" />
                )}
                Invite
              </Button>
            </div>
          </motion.div>
        )}

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
              const RoleIcon = roleInfo?.icon || Users;
              const isCurrentUser = member.user_id === user?.id;
              const canModify = canManageMembers && !isCurrentUser && member.role !== 'owner';

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className="flex items-center gap-4 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {member.profiles?.display_name?.charAt(0).toUpperCase() || 
                     member.profiles?.email?.charAt(0).toUpperCase() || '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.profiles?.display_name || member.profiles?.email || 'Unknown'}
                        {isCurrentUser && <span className="text-muted-foreground"> (You)</span>}
                      </p>
                      {member.role === 'owner' && (
                        <Crown className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{member.profiles?.email}</p>
                  </div>

                  <div className={`flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium ${roleInfo?.color || 'text-muted-foreground'}`}>
                    <RoleIcon className="h-3 w-3" />
                    {roleInfo?.label || member.role}
                  </div>

                  {canModify && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canChangeRoles && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setMemberToChangeRole({ id: member.id, currentRole: member.role });
                              setNewRole(member.role === 'owner' ? 'admin' : (member.role as 'admin' | 'member'));
                            }}>
                              <Shield className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setMemberToRemove(member.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
          <div className="grid gap-4 sm:grid-cols-3">
            {(['owner', 'admin', 'member'] as const).map((role) => {
              const roleInfo = roleLabels[role];
              const RoleIcon = roleInfo.icon;
              return (
                <div key={role} className="space-y-2">
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${roleInfo.color}`}>
                    <RoleIcon className="h-4 w-4" />
                    {roleInfo.label}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {rolePermissions[role].map((permission, i) => (
                      <li key={i}>• {permission}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Remove Member Dialog */}
        <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this member from your household? They will lose access to the inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Change Role Dialog */}
        <AlertDialog open={!!memberToChangeRole} onOpenChange={() => setMemberToChangeRole(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Member Role</AlertDialogTitle>
              <AlertDialogDescription>
                Select a new role for this member.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Select value={newRole} onValueChange={(value) => setNewRole(value as 'admin' | 'member')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleChangeRole}>
                Save Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
