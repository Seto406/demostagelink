import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Share2, MessageCircle, MoreHorizontal, Heart, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PostCommentSection } from "./PostCommentSection";
import { cn } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export interface FeedUpdateProps {
  post: {
    id: string;
    content: string;
    media_urls: string[] | null;
    created_at: string;
    profile_id: string;
    profiles: {
      id: string; // This is the profile ID
      user_id?: string | null;
      username: string | null;
      group_name: string | null;
      avatar_url: string | null;
      group_logo_url: string | null;
    };
    post_likes?: { count: number }[];
  };
  onDelete?: (id: string) => void;
}

export function FeedUpdate({ post, onDelete }: FeedUpdateProps) {
  const { user, profile } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.post_likes?.[0]?.count || 0);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  const isOwner =
    profile?.id === post.profile_id ||
    (!!user?.id && post.profiles?.user_id === user.id);
  const authorName = post.profiles?.group_name || post.profiles?.username || "Unknown User";
  const authorAvatar = post.profiles?.group_logo_url || post.profiles?.avatar_url;
  const initials = authorName.substring(0, 2).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  const fetchInteractionState = useCallback(async () => {
    if (!profile) return;

    // Check if liked
    const { data } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("profile_id", profile.id)
      .maybeSingle();

    setIsLiked(!!data);

    // Get exact like count
    const { count: lCount } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    if (lCount !== null) setLikeCount(lCount);

    // Get comment count
    const { count: cCount } = await supabase
      .from("post_comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    if (cCount !== null) setCommentCount(cCount);

  }, [post.id, profile]);

  useEffect(() => {
    fetchInteractionState();

    const channel = supabase
      .channel(`post_interactions-${post.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes', filter: `post_id=eq.${post.id}` }, () => fetchInteractionState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${post.id}` }, () => fetchInteractionState())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, fetchInteractionState]);

  const handleLike = async () => {
    if (!profile) {
      toast({ title: "Login Required", description: "Please log in to like posts." });
      return;
    }

    // Optimistic update
    const previousLiked = isLiked;
    const previousCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      if (previousLiked) {
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("profile_id", profile.id);
      } else {
        await supabase.from("post_likes").insert({ post_id: post.id, profile_id: profile.id });

        // Notify author if not self
        if (post.profile_id !== profile.id) {
           const actorName = profile?.group_name || profile?.username || "Someone";
           await createNotification({
             userId: post.profile_id,
             actorId: profile.id,
             type: "like",
             title: "New Like",
             message: `${actorName} liked your update.`,
             link: `/feed`
           });
        }
      }
    } catch (error) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast({ title: "Error", description: "Failed to like post.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
      if (!user?.id) {
        toast({ title: "Error", description: "You need to be signed in to delete a post.", variant: "destructive" });
        return;
      }

      if (!isOwner) {
        toast({ title: "Error", description: "You can only delete your own post.", variant: "destructive" });
        return;
      }

      try {
          const { data, error } = await supabase
            .from('posts')
            .delete()
            .eq('id', post.id)
            .select('id');

          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Delete was blocked by row-level security or the post no longer exists.");
          }

          toast({ title: "Deleted", description: "Post deleted successfully." });
          if (onDelete) onDelete(post.id);
      } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to delete post.";
          console.error("Post delete failed", {
            postId: post.id,
            postProfileId: post.profile_id,
            activeProfileId: profile?.id,
            authUserId: user?.id,
            postOwnerUserId: post.profiles?.user_id,
            isOwner,
            error: e,
          });
          toast({ title: "Error", description: message, variant: "destructive" });
      }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/feed`); // Todo: deep link
    toast({ title: "Link copied", description: "Link copied to clipboard." });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-secondary/40 transition-colors">
        <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
             <Link to={`/producer/${post.profiles?.id || post.profile_id}`}>
               <Avatar className="h-10 w-10 border border-secondary/30">
                 <AvatarImage src={authorAvatar || undefined} />
                 <AvatarFallback>{initials}</AvatarFallback>
               </Avatar>
             </Link>
             <div className="flex flex-col">
               <Link to={`/producer/${post.profiles?.id || post.profile_id}`} className="font-semibold text-sm hover:underline">
                 {authorName}
               </Link>
               <span className="text-xs text-muted-foreground">{timeAgo}</span>
             </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Copy Link</span>
              </DropdownMenuItem>
              {isOwner && (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Post</span>
                  </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="p-4 pt-2 space-y-4">
           {post.content && (
               <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
           )}

           {post.media_urls && post.media_urls.length > 0 && (
               <div className="w-full rounded-lg overflow-hidden border border-secondary/20 bg-black/5">
                   {post.media_urls.length === 1 ? (
                       <img
                          src={post.media_urls[0]}
                          alt="Post attachment"
                          className="w-full h-auto max-h-[500px] object-contain"
                          loading="lazy"
                       />
                   ) : (
                       <Carousel className="w-full">
                           <CarouselContent>
                               {post.media_urls.map((url, idx) => (
                                   <CarouselItem key={idx}>
                                       <div className="p-1">
                                            <img
                                                src={url}
                                                alt={`Slide ${idx + 1}`}
                                                className="w-full h-auto max-h-[500px] object-contain rounded-md"
                                                loading="lazy"
                                            />
                                       </div>
                                   </CarouselItem>
                               ))}
                           </CarouselContent>
                           <CarouselPrevious className="left-2" />
                           <CarouselNext className="right-2" />
                       </Carousel>
                   )}
               </div>
           )}
        </CardContent>

        <CardFooter className="flex flex-col p-0">
             <div className="w-full p-3 flex items-center gap-4 border-t border-secondary/10 bg-secondary/5">
                 <Button
                    variant="ghost"
                    size="sm"
                    className={cn("gap-2 hover:bg-background/50", isLiked && "text-red-500 hover:text-red-600")}
                    onClick={handleLike}
                 >
                     <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                     <span className="text-xs">{likeCount > 0 ? likeCount : "Like"}</span>
                 </Button>

                 <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 hover:bg-background/50"
                    onClick={() => setShowComments(!showComments)}
                 >
                     <MessageCircle className="w-4 h-4" />
                     <span className="text-xs">{commentCount > 0 ? commentCount : "Comment"}</span>
                 </Button>
             </div>

             {showComments && (
                 <div className="w-full px-4 pb-4 bg-secondary/5">
                     <PostCommentSection postId={post.id} postAuthorId={post.profile_id} />
                 </div>
             )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
