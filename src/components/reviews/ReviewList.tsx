import { useEffect, useState, useCallback, useMemo } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { User, Trash2, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

type ReviewSort = "recent" | "highest" | "lowest";

interface Review {
  id: string;
  user_id: string;
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
  onSummaryChange?: (summary: { averageRating: number; reviewCount: number }) => void;
}

export const ReviewList = ({ showId, refreshTrigger, isUpcoming, producerId, onSummaryChange }: ReviewListProps) => {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<ReviewSort>("recent");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingRating, setEditingRating] = useState(5);
  const [editingComment, setEditingComment] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const canModerate = profile && (profile.role === "admin" || (producerId && profile.id === producerId));

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
        const fetchedReviews = data as unknown as Review[];
        const visibleReviews = canModerate ? fetchedReviews : fetchedReviews.filter((review) => review.is_approved);
        setReviews(visibleReviews);
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

  const publicReviews = useMemo(() => reviews.filter((review) => review.is_approved), [reviews]);

  const sortedReviews = useMemo(() => {
    const sortable = [...reviews];

    if (sortBy === "highest") {
      return sortable.sort((a, b) => b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    if (sortBy === "lowest") {
      return sortable.sort((a, b) => a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return sortable.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reviews, sortBy]);

  const averageRating = useMemo(() => {
    if (!publicReviews.length) return 0;
    const total = publicReviews.reduce((sum, review) => sum + review.rating, 0);
    return total / publicReviews.length;
  }, [publicReviews]);

  useEffect(() => {
    onSummaryChange?.({
      averageRating,
      reviewCount: publicReviews.length,
    });
  }, [averageRating, publicReviews.length, onSummaryChange]);

  const handleEditStart = (review: Review) => {
    setEditingReviewId(review.id);
    setEditingRating(review.rating);
    setEditingComment(review.comment || "");
  };

  const handleEditCancel = () => {
    setEditingReviewId(null);
    setEditingRating(5);
    setEditingComment("");
  };

  const handleEditSave = async (reviewId: string) => {
    setIsSavingEdit(true);
    try {
      const updatePayload: { rating?: number; comment: string | null } = {
        comment: editingComment.trim() || null,
      };

      if (!isUpcoming) {
        updatePayload.rating = editingRating;
      }

      const { error } = await supabase.from("reviews").update(updatePayload).eq("id", reviewId);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                comment: updatePayload.comment,
                rating: updatePayload.rating ?? review.rating,
              }
            : review,
        ),
      );

      toast.success("Review updated");
      handleEditCancel();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      if (!profile?.id) {
        throw new Error("You must be signed in to delete a review");
      }

      let deleteQuery = supabase.from("reviews").delete().eq("id", reviewId);

      if (!canModerate) {
        deleteQuery = deleteQuery.eq("user_id", profile.id);
      }

      const { error } = await deleteQuery;

      if (error) throw error;

      toast.success("Review deleted permanently");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (editingReviewId === reviewId) {
        handleEditCancel();
      }
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
      {!isUpcoming && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-secondary/10 bg-card/60">
          <div>
            <p className="text-sm text-muted-foreground">Audience rating</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">{averageRating.toFixed(1)}</span>
              <StarRating rating={averageRating} readOnly size={14} />
              <span className="text-xs text-muted-foreground">({publicReviews.length} reviews)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="review-sort" className="text-xs text-muted-foreground">Sort</label>
            <select
              id="review-sort"
              className="h-9 rounded-md border border-secondary/20 bg-background px-3 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as ReviewSort)}
            >
              <option value="recent">Most recent</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          </div>
        </div>
      )}

      {sortedReviews.map((review) => {
        const canEditOwnReview = profile?.id === review.user_id;
        const isEditing = editingReviewId === review.id;

        return (
          <div key={review.id} className={`border-b border-secondary/10 pb-6 last:border-0 last:pb-0 ${!review.is_approved ? "opacity-60 bg-secondary/5 p-4 rounded-lg" : ""}`}>
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
                      {review.profiles?.username || review.profiles?.group_name || (review.profiles?.first_name ? `${review.profiles.first_name} ${review.profiles.last_name || ""}`.trim() : "Audience Member")}
                      {!review.is_approved && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/30 font-semibold uppercase tracking-wider">Moderated</span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {!isUpcoming && <StarRating rating={isEditing ? editingRating : review.rating} readOnly size={16} />}

                    {(canModerate || canEditOwnReview) && (
                      <div className="flex items-center gap-1">
                        {canEditOwnReview && !isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-secondary"
                            title="Edit Review"
                            onClick={() => handleEditStart(review)}
                          >
                            <Pencil className="w-3 h-3" />
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

                {isEditing ? (
                  <div className="space-y-3">
                    {!isUpcoming && (
                      <div>
                        <label className="block text-xs text-muted-foreground mb-2">Rating</label>
                        <StarRating rating={editingRating} onRatingChange={setEditingRating} size={20} />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs text-muted-foreground mb-2">Comment</label>
                      <Textarea
                        value={editingComment}
                        onChange={(event) => setEditingComment(event.target.value)}
                        className="bg-background border-secondary/30 min-h-[90px]"
                        placeholder="Update your review..."
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleEditSave(review.id)} disabled={isSavingEdit}>
                        {isSavingEdit ? "Saving..." : "Save changes"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleEditCancel} disabled={isSavingEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
