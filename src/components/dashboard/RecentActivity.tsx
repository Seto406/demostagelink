import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Clock } from "lucide-react";

interface RecentActivityProps {
  showIds: string[];
}

interface ActivityItem {
  id: string;
  created_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  shows: {
    title: string | null;
  } | null;
}

export const RecentActivity = ({ showIds }: RecentActivityProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      if (showIds.length === 0) {
        setLoading(false);
        return;
      }

      // Supabase supports `in` filter
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          created_at,
          profiles:user_id (
            username,
            avatar_url
          ),
          shows:show_id (
            title
          )
        `)
        .in("show_id", showIds)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching activity:", error);
      } else {
        setActivities(data as unknown as ActivityItem[]);
      }
      setLoading(false);
    };

    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(showIds)]); // Depend on deep comparison of IDs

  if (loading) {
      return (
        <Card className="bg-card border-secondary/20 h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-32">
                <BrandedLoader size="sm" />
            </CardContent>
        </Card>
      );
  }

  if (activities.length === 0) {
    return (
        <Card className="bg-card border-secondary/20 h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center py-6 text-muted-foreground text-sm">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity yet.</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-card border-secondary/20 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((item) => (
          <div key={item.id} className="flex items-start gap-3 text-sm border-b border-secondary/10 last:border-0 pb-3 last:pb-0">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 overflow-hidden mt-1">
                {item.profiles?.avatar_url ? (
                    <img src={item.profiles.avatar_url} alt="User" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-xs font-bold text-secondary">
                        {(item.profiles?.username?.[0] || "G").toUpperCase()}
                    </span>
                )}
            </div>
            <div>
                <p className="text-foreground leading-snug">
                    <span className="font-medium">{item.profiles?.username || "Guest"}</span>
                    <span className="text-muted-foreground"> reserved a ticket for </span>
                    <span className="font-medium text-primary block sm:inline">{item.shows?.title || "Unknown Show"}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
