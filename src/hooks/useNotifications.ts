import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

// Create beep sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Play a second beep
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.5);
    }, 200);
  } catch (error) {
    console.log('Audio playback not available:', error);
  }
};

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const processedIds = useRef<Set<string>>(new Set());

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Initialize processed IDs with existing notifications
      (data || []).forEach((n: Notification) => processedIds.current.add(n.id));
      
      return data as Notification[];
    },
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const handleNewNotification = useCallback((payload: any) => {
    const newNotification = payload.new as Notification;
    
    // Check if we've already processed this notification
    if (processedIds.current.has(newNotification.id)) {
      return;
    }
    
    // Mark as processed
    processedIds.current.add(newNotification.id);
    
    // Play sound
    playNotificationSound();
    
    // Show toast popup
    toast(newNotification.title, {
      description: newNotification.message,
      duration: 8000,
      action: {
        label: 'View',
        onClick: () => {
          if (newNotification.type === 'parts_request') {
            window.location.href = '/inventory';
          }
        },
      },
    });

    // Invalidate queries to refresh the list
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  }, [queryClient, user?.id]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        handleNewNotification
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleNewNotification]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
  };
};

export const usePendingApprovals = () => {
  const { role } = useAuth();

  return useQuery({
    queryKey: ['pending-approvals', role],
    queryFn: async () => {
      if (role === 'admin') {
        // Get pending requests awaiting admin approval
        const { data, error } = await supabase
          .from('stock_requests')
          .select('*, inventory_items(name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } else if (role === 'storekeeper') {
        // Get admin-approved requests awaiting dispatch
        const { data, error } = await supabase
          .from('stock_requests')
          .select('*, inventory_items(name)')
          .eq('status', 'admin_approved')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      }
      return [];
    },
    enabled: role === 'admin' || role === 'storekeeper',
  });
};
