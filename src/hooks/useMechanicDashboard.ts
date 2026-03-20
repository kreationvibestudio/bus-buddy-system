import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRecentCompletedJobCards(limit: number = 5) {
  return useQuery({
    queryKey: ['recent-completed-job-cards', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          *,
          bus:buses(registration_number, model)
        `)
        .eq('status', 'completed')
        .order('actual_completion', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

export function useOverdueJobCards() {
  return useQuery({
    queryKey: ['overdue-job-cards'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get job cards that are open for more than 2 days
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          *,
          bus:buses(registration_number, model)
        `)
        .not('status', 'in', '("completed","closed")')
        .lt('created_at', twoDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useMechanicStats() {
  return useQuery({
    queryKey: ['mechanic-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all job cards for mechanic
      const { data: allJobCards, error: allError } = await supabase
        .from('job_cards')
        .select('id, status, actual_completion')
        .eq('mechanic_id', user.id);

      if (allError) throw allError;

      // Calculate stats
      const activeCount = allJobCards?.filter(jc => 
        !['completed', 'closed'].includes(jc.status)
      ).length || 0;

      const inProgressCount = allJobCards?.filter(jc => 
        jc.status === 'in_progress'
      ).length || 0;

      const awaitingPartsCount = allJobCards?.filter(jc => 
        jc.status === 'awaiting_parts'
      ).length || 0;

      // Completed this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const completedThisWeek = allJobCards?.filter(jc => 
        jc.status === 'completed' && 
        jc.actual_completion && 
        new Date(jc.actual_completion) >= weekStart
      ).length || 0;

      return {
        activeCount,
        inProgressCount,
        awaitingPartsCount,
        completedThisWeek,
      };
    },
  });
}
