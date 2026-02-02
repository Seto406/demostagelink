import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Button } from "@/components/ui/button";
import { CheckCheck, BellOff } from "lucide-react";
import { NotificationItem, Notification } from "@/components/notifications/NotificationItem";
import { motion } from "framer-motion";

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data as Notification[]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Subscribe to real-time notifications
      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else if (!authLoading) {
        setLoading(false);
    }
  }, [user, authLoading, fetchNotifications]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user!.id)
      .eq("read", false);
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandedLoader size="lg" text="Loading notifications..." />
      </div>
    );
  }

  if (!user) {
     return (
        <div className="min-h-screen bg-background">
           {/* Fix import in next step if Navbar is default */}
           <Navbar />
           <div className="pt-24 container mx-auto px-4 text-center">
              <p>Please log in to view notifications.</p>
           </div>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="pt-24 container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-serif font-bold text-foreground">Notifications</h1>
          {notifications.some(n => !n.read) && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-secondary hover:text-secondary/80">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-secondary/20 rounded-2xl overflow-hidden min-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground p-6 text-center">
              <BellOff className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">No notifications yet</h3>
              <p className="text-sm">When you get likes, comments or updates, they'll show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary/10">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <NotificationItem
                    notification={notification}
                    onRead={markAsRead}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
