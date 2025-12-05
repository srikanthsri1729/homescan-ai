import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/hooks/useHousehold';

export function useAINotifications() {
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();

  const generateNotifications = useCallback(async () => {
    if (!user || !currentHousehold) return;

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-notifications', {
        body: {
          userId: user.id,
          householdId: currentHousehold.id,
        },
      });

      if (error) {
        console.error('Failed to generate notifications:', error);
      } else {
        console.log('Notifications generated:', data);
      }
    } catch (error) {
      console.error('Error generating notifications:', error);
    }
  }, [user, currentHousehold]);

  // Generate notifications on mount and when items change
  useEffect(() => {
    if (!user || !currentHousehold) return;

    // Initial generation with delay to not block initial load
    const timeout = setTimeout(() => {
      generateNotifications();
    }, 5000);

    // Subscribe to item changes to trigger notification generation
    const channel = supabase
      .channel('items-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `household_id=eq.${currentHousehold.id}`,
        },
        () => {
          // Debounce: wait a bit before generating to avoid too many calls
          setTimeout(() => {
            generateNotifications();
          }, 2000);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [user, currentHousehold, generateNotifications]);

  return { generateNotifications };
}
