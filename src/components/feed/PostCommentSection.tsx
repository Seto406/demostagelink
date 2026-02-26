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
  profile_id: string;
  deleted_at: string | null;
  profiles: {
    username: string | null;
    group_name: string | null;
    avatar_url: string | null;
  };
}

interface PostCommentSectionProps {
  postId: string;
  postAuthorId: string; // This is a profile_id
}

export function PostCommentSection({ postId, postAuthorId }: PostCommentSectionProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          id,
          content,
          created_at,
          profile_id,
          deleted_at,
          profiles:profile_id (
            username,
            group_name,
            avatar_url
          )
        `)
        .eq("post_id", postId)
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
  }, [postId]);

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`post_comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("post_comments")
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
        .from("post_comments")
        .insert({
          profile_id: profile.id,
          post_id: postId,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      fetchComments();

      toast({
        title: "Comment added",
        description: "Your comment has been posted.",
      });

      // Send notification to post author
      if (postAuthorId !== profile.id) {
        const actorName = profile.group_name || profile.username || "Someone";
        await createNotification({
          userId: postAuthorId,
          actorId: profile.id,
          type: "comment",
          title: "New Comment",
          message: `${actorName} commented on your update.`,
          link: `/feed`,
        });
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
            const commenterName = comment.profiles?.group_name || comment.profiles?.username || "User";
            const initials = commenterName.substring(0, 2).toUpperCase();

            // Check permissions
            const isAuthor = profile?.id === comment.profile_id;
            const isPostAuthor = profile?.id === postAuthorId;
            const isAdmin = profile?.role === 'admin';
            const canDelete = isAuthor || isPostAuthor || isAdmin;

            return (
              <div key={comment.id} className="flex gap-3 group">
                <Link to={`/profile/${comment.profile_id}`}>
                  <Avatar className="w-8 h-8 border border-secondary/20 hover:border-secondary transition-colors">
                    <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${comment.profile_id}`} className="hover:underline">
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
            <AvatarFallback className="text-[10px]">{profile?.group_name?.[0] || profile?.username?.[0] || "ME"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
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
