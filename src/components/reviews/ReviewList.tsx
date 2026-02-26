import { useEffect, useState, useCallback } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { User, EyeOff, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_approved: boolean;
  profiles: {
    group_name: string | null;
    avatar_url: string | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface ReviewListProps {
  showId: string;
  refreshTrigger: number;
  isUpcoming?: boolean;
  producerId?: string;
}

export const ReviewList = ({ showId, refreshTrigger, isUpcoming, producerId }: ReviewListProps) => {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine if the current user has moderation rights
  const canModerate = profile && (profile.role === 'admin' || (producerId && profile.id === producerId));

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
        let fetchedReviews = data as unknown as Review[];

        // Filter reviews based on approval status and user role
        if (!canModerate) {
          fetchedReviews = fetchedReviews.filter(review => review.is_approved);
        }

        setReviews(fetchedReviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showId, canModerate]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshTrigger]);

  const handleHideReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved: false })
        .eq("id", reviewId);

      if (error) throw error;

      toast.success("Review hidden from public view");

      // Update local state
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, is_approved: false } : r));
    } catch (error) {
      console.error("Error hiding review:", error);
      toast.error("Failed to hide review");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast.success("Review deleted permanently");

      // Update local state
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

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
        <div key={review.id} className={`border-b border-secondary/10 pb-6 last:border-0 last:pb-0 ${!review.is_approved ? 'opacity-60 bg-secondary/5 p-4 rounded-lg' : ''}`}>
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
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    {review.profiles?.group_name || review.profiles?.username || (review.profiles?.first_name ? `${review.profiles.first_name} ${review.profiles.last_name || ''}` : "Audience Member")}
                    {!review.is_approved && (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/30">Hidden</span>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {!isUpcoming && <StarRating rating={review.rating} readOnly size={16} />}

                  {canModerate && (
                    <div className="flex items-center gap-1">
                      {review.is_approved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-yellow-500"
                          onClick={() => handleHideReview(review.id)}
                          title="Hide Review"
                        >
                          <EyeOff className="w-3 h-3" />
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            title="Delete Review"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently remove the review.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteReview(review.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
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
