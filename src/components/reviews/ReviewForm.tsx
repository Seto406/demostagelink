import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/hooks/useGamification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReviewFormProps {
  showId: string;
  onReviewSubmitted: () => void;
  isUpcoming?: boolean;
}

export const ReviewForm = ({ showId, onReviewSubmitted, isUpcoming }: ReviewFormProps) => {
  const { user, profile } = useAuth();
  const { addXp } = useGamification();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast.error("Authentication required", {
        description: "Please log in to leave a review.",
      });
      return;
    }

    if (!isUpcoming && rating === 0) {
      toast.error("Rating required", {
        description: "Please select a star rating.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("reviews")
        .insert({
          show_id: showId,
          user_id: user.id,
          rating: isUpcoming ? 0 : rating,
          comment: comment.trim() || null,
          is_approved: true,
        });

      if (error) throw error;

      toast.success("Review submitted", {
        description: "Thank you for your feedback!",
      });

      // Award XP for review
      try {
        await addXp(50);
      } catch (e) {
        console.error("Failed to add XP", e);
      }

      setRating(0);
      setComment("");
      onReviewSubmitted();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Submission failed", {
        description: "Failed to submit your review. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-card/50 border border-secondary/20 rounded-xl p-6 text-center">
        <p className="text-muted-foreground mb-4">
          Have you seen this show? Log in to share your thoughts.
        </p>
        <Button variant="outline" onClick={() => window.location.href = "/login"}>
          Log in to Review
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-secondary/20 rounded-xl p-6">
      <h3 className="font-serif text-xl text-foreground mb-4">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isUpcoming && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Rating
            </label>
            <StarRating rating={rating} onRatingChange={setRating} size={24} />
          </div>
        )}

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-muted-foreground mb-2">
            Your Thoughts {isUpcoming ? "" : "(Optional)"}
          </label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isUpcoming ? "Share your excitement or questions..." : "What did you think of the performance?"}
            className="bg-background border-secondary/30 min-h-[100px]"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || (!isUpcoming && rating === 0)}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
      </form>
    </div>
  );
};
