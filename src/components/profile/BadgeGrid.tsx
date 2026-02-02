import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  slug: string;
}

interface BadgeGridProps {
  userId: string;
}

export const BadgeGrid = ({ userId }: BadgeGridProps) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      // First fetch user_badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId);

      if (userBadgesError) {
        console.error("Error fetching user badges:", userBadgesError);
        setLoading(false);
        return;
      }

      if (userBadges && userBadges.length > 0) {
        const badgeIds = userBadges.map(ub => ub.badge_id);
        const { data: badgesData, error: badgesError } = await supabase
          .from("badges")
          .select("*")
          .in("id", badgeIds);

        if (!badgesError && badgesData) {
          setBadges(badgesData);
        }
      } else {
        setBadges([]);
      }
      setLoading(false);
    };

    fetchBadges();
  }, [userId]);

  if (loading) {
    return (
      <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Award className="w-5 h-5 text-secondary" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Award className="w-5 h-5 text-secondary" />
          Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No badges earned yet. Start exploring to unlock!
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
            {badges.map((badge) => (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-2 cursor-pointer group">
                      <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center text-3xl group-hover:bg-secondary/20 transition-colors">
                        {badge.icon_url || "🏅"}
                      </div>
                      <span className="text-xs text-center font-medium line-clamp-1">{badge.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
