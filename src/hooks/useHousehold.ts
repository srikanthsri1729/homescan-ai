import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Household {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  profiles?: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export function useHousehold() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: households, isLoading: loadingHouseholds } = useQuery({
    queryKey: ['households', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Household[];
    },
    enabled: !!user,
  });

  const currentHousehold = households?.[0];

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['household-members', currentHousehold?.id],
    queryFn: async () => {
      if (!currentHousehold) return [];
      
      // Get members
      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', currentHousehold.id);
      
      if (membersError) throw membersError;
      
      // Get profiles for members
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Combine data
      return membersData.map(member => ({
        ...member,
        profiles: profilesData.find(p => p.user_id === member.user_id) || null,
      })) as HouseholdMember[];
    },
    enabled: !!currentHousehold,
  });

  const userRole = members?.find(m => m.user_id === user?.id)?.role;

  const updateHousehold = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const { error } = await supabase
        .from('households')
        .update({ name, description })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      toast({ title: 'Household updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating household', description: error.message, variant: 'destructive' });
    },
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'admin' | 'member' }) => {
      // First find the user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      
      if (profileError) throw profileError;
      if (!profile) throw new Error('User not found with that email');
      
      // Add them to the household
      const { error } = await supabase
        .from('household_members')
        .insert({
          household_id: currentHousehold!.id,
          user_id: profile.user_id,
          role,
        });
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('User is already a member of this household');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-members'] });
      toast({ title: 'Member invited successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error inviting member', description: error.message, variant: 'destructive' });
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'admin' | 'member' }) => {
      const { error } = await supabase
        .from('household_members')
        .update({ role })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-members'] });
      toast({ title: 'Member role updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating role', description: error.message, variant: 'destructive' });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-members'] });
      toast({ title: 'Member removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error removing member', description: error.message, variant: 'destructive' });
    },
  });

  return {
    households,
    currentHousehold,
    members,
    userRole,
    loadingHouseholds,
    loadingMembers,
    updateHousehold,
    inviteMember,
    updateMemberRole,
    removeMember,
  };
}
