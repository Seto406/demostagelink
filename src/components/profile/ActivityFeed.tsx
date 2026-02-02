import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Star, Heart, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  action_type: string;
  entity_type: string | null;
  created_at: string;
  metadata: any; // using any for simplicity with JSONB
}

interface ActivityFeedProps {
  userId: string;
}

export const ActivityFeed = ({ userId }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setActivities(data);
      }
      setLoading(false);
    };

    fetchActivities();
  }, [userId]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "review": return <Star className="w-4 h-4 text-yellow-500" />;
      case "favorite": return <Heart className="w-4 h-4 text-red-500" />;
      case "attend": return <Calendar className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-secondary" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const meta = activity.metadata || {};
    switch (activity.action_type) {
      case "review":
        return `Reviewed "${meta.show_title || 'a show'}"`;
      case "favorite":
        return `Favorited "${meta.show_title || 'a show'}"`;
      case "join":
        return "Joined StageLink Community";
      default:
        return "Performed an action";
    }
  };

  if (loading) {
    return (
      <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Activity className="w-5 h-5 text-secondary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Activity className="w-5 h-5 text-secondary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity to show.
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-secondary/10 last:border-0 last:pb-0">
                <div className="mt-1 p-2 rounded-full bg-secondary/10 border border-secondary/20">
                  {getActivityIcon(activity.action_type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
