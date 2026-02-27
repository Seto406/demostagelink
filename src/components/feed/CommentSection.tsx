import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createNotification } from "@/lib/notifications";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  deleted_at: string | null;
  profiles: {
    username: string | null;
    group_name: string | null;
    avatar_url: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  shows?: {
    producer_id: string;
  };
}

interface CommentSectionProps {
  showId: string;
}

export function CommentSection({ showId }: CommentSectionProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          deleted_at,
          profiles (
            username,
            group_name,
            avatar_url,
            first_name,
            last_name
          ),
          shows (
            producer_id
          )
        `)
        .eq("show_id", showId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Filter out deleted comments
      const activeComments = (data as unknown as Comment[]).filter(c => !c.deleted_at);
      setComments(activeComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments-${showId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `show_id=eq.${showId}`
        },
        () => {
          // Optimistically fetch or just append if we have the user data.
          // For simplicity, we'll re-fetch to get the profile relation
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showId, fetchComments]);

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", commentId);

      if (error) throw error;

      toast({
        title: "Comment deleted",
        description: "The comment has been removed.",
      });

      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast({
        title: "Login Required",
        description: "Please log in to leave a comment.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          user_id: profile.id,
          show_id: showId,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      // Realtime subscription will handle the update, but for immediate feedback:
      fetchComments();

      toast({
        title: "Comment added",
        description: "Your comment has been posted.",
      });

      // Send notification to show producer
      try {
        const { data: showData } = await supabase
          .from("shows")
          .select("producer_id, title")
          .eq("id", showId)
          .single();

        if (showData && profile?.id && showData.producer_id !== profile.id) {
          const actorName = profile.group_name || profile.username || "Someone";
          await createNotification({
            userId: showData.producer_id,
            actorId: profile.id,
            type: "comment",
            title: "New Comment",
            message: `${actorName} commented on your show: ${showData.title}`,
            link: `/show/${showId}`,
          });
        }
      } catch (e) {
        console.error("Error creating notification", e);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4 border-t border-secondary/10">
      <h4 className="text-sm font-semibold text-foreground">Comments ({comments.length})</h4>

      {/* Comment List */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => {
            // Priority: username -> group_name -> first_name + last_name -> "User"
            const commenterName =
                comment.profiles?.username ||
                comment.profiles?.group_name ||
                (comment.profiles?.first_name ? `${comment.profiles.first_name} ${comment.profiles.last_name || ''}`.trim() : "User");
            const initials = commenterName.substring(0, 2).toUpperCase();

            // Check permissions
            const isAuthor = profile?.id === comment.user_id;
            const isProducer = profile?.id === comment.shows?.producer_id;
            const isAdmin = profile?.role === 'admin';
            const canDelete = isAuthor || isProducer || isAdmin;

            return (
              <div key={comment.id} className="flex gap-3 group">
                <Link to={`/profile/${comment.user_id}`}>
                  <Avatar className="w-8 h-8 border border-secondary/20 hover:border-secondary transition-colors">
                    <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${comment.user_id}`} className="hover:underline">
                        <span className="text-sm font-medium text-foreground">{commenterName}</span>
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Delete comment</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 items-start">
          <Avatar className="w-8 h-8 border border-secondary/20">
            {/* We assume we have user context with avatar, but for now simple fallback */}
            <AvatarFallback className="text-[10px]">ME</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              aria-label="Write a comment"
              className="min-h-[40px] h-[40px] py-2 resize-none bg-background/50 border-secondary/20 focus:ring-secondary/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Post comment"
              disabled={submitting || !newComment.trim()}
              className="h-[40px] w-[40px] shrink-0 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-secondary/5 rounded-lg p-3 text-center">
          <p className="text-sm text-muted-foreground">
            Please <span className="font-semibold text-secondary">log in</span> to comment.
          </p>
        </div>
      )}
    </div>
  );
}
