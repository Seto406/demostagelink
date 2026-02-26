import { useEffect, useState, useCallback } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { User } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: {
    group_name: string | null;
    avatar_url: string | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    is_premium?: boolean;
  } | null;
}

interface ReviewListProps {
  showId: string;
  refreshTrigger: number;
  isUpcoming?: boolean;
}

export const ReviewList = ({ showId, refreshTrigger, isUpcoming }: ReviewListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles (*)
        `)
        .eq("show_id", showId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
      } else {
        // Safe cast as we know the structure from the query
        const loadedReviews = data as unknown as Review[];

        // Sort: Premium users first
        loadedReviews.sort((a, b) => {
            const aPremium = a.profiles?.is_premium;
            const bPremium = b.profiles?.is_premium;

            if (aPremium !== bPremium) {
                return aPremium ? -1 : 1;
            }

            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setReviews(loadedReviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshTrigger]);

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-muted-foreground italic text-center py-8 bg-card/50 border border-secondary/10 rounded-xl">
        No reviews yet. Be the first to share your thoughts!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-secondary/10 pb-6 last:border-0 last:pb-0">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {review.profiles?.avatar_url ? (
                <img
                  src={review.profiles.avatar_url}
                  alt={review.profiles.group_name || "User"}
                  className="w-10 h-10 rounded-full object-cover border border-secondary/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/30">
                  <User className="w-5 h-5 text-secondary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-medium text-foreground">
                    {review.profiles?.group_name || review.profiles?.username || (review.profiles?.first_name ? `${review.profiles.first_name} ${review.profiles.last_name || ''}` : "Audience Member")}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!isUpcoming && <StarRating rating={review.rating} readOnly size={16} />}
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
