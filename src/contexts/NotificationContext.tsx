/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface NotificationContextType {
  unreadCount: number;
  newNotificationSignal: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotificationSignal, setNewNotificationSignal] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!profile) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('read', false);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
    }
  }, [profile]);

  useEffect(() => {
    fetchUnreadCount();

    if (!profile) return;

    const channel = supabase
      .channel(`unread-notifications-global-${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          fetchUnreadCount();
          if (payload.eventType === "INSERT") {
            setNewNotificationSignal((prev) => prev + 1);

            // Show toast for new notification
            const newNotification = payload.new as any;
            if (newNotification.title && newNotification.message) {
              toast({
                title: newNotification.title,
                description: newNotification.message,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, newNotificationSignal, refreshUnreadCount: fetchUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
