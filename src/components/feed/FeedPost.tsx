import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Calendar, Share2, MessageCircle, MoreHorizontal, Ticket } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { useFavorites } from "@/hooks/use-favorites";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { CommentSection } from "@/components/feed/CommentSection";
import { supabase } from "@/integrations/supabase/client";

export interface FeedPostProps {
  show: {
    id: string;
    title: string;
    description: string | null;
    date: string | null;
    venue: string | null;
    city: string | null;
    poster_url: string | null;
    created_at?: string;
    ticket_link?: string | null;
    profiles?: {
      group_name: string | null;
      id: string;
      avatar_url: string | null;
    };
    favorites?: { count: number }[];
  };
}

export function FeedPost({ show }: FeedPostProps) {
  const { toggleFavorite, isFavorited } = useFavorites();
  const [showComments, setShowComments] = useState(false);
  const [likeCount, setLikeCount] = useState(show.favorites?.[0]?.count || 0);
  const [commentCount, setCommentCount] = useState(0);

  const producerName = show.profiles?.group_name || "Unknown Group";
  const producerAvatar = show.profiles?.avatar_url;
  const initials = producerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const timeAgo = show.created_at
    ? formatDistanceToNow(new Date(show.created_at), { addSuffix: true })
    : "recently";

  const fetchLikeCount = useCallback(async () => {
    const { count } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('show_id', show.id);
    if (count !== null) setLikeCount(count);
  }, [show.id]);

  const fetchCommentCount = useCallback(async () => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('show_id', show.id);
    if (count !== null) setCommentCount(count);
  }, [show.id]);

  useEffect(() => {
    // Initial fetch removed to prevent N+1 queries - data is now passed from parent
    // fetchLikeCount();
    // fetchCommentCount(); // Comments disabled

    // Subscriptions for real-time counts
    const likeChannel = supabase.channel(`likes-${show.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorites', filter: `show_id=eq.${show.id}` }, () => {
         fetchLikeCount();
      })
      .subscribe();

    // const commentChannel = supabase.channel(`comments-count-${show.id}`)
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `show_id=eq.${show.id}` }, () => {
    //      fetchCommentCount();
    //   })
    //   .subscribe();

    return () => {
      supabase.removeChannel(likeChannel);
      // supabase.removeChannel(commentChannel);
    };
  }, [show.id, fetchLikeCount, fetchCommentCount]);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/show/${show.id}`);
    toast({
      title: "Link copied",
      description: "Show link copied to clipboard.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-secondary/40 transition-colors">
        {/* Header */}
        <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <Link to={`/group/${show.profiles?.id}`} className="hover:opacity-80 transition-opacity">
              <Avatar className="h-10 w-10 border border-secondary/30">
                <AvatarImage src={producerAvatar || undefined} alt={producerName} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <Link to={`/group/${show.profiles?.id}`} className="font-semibold text-sm hover:underline">
                  {producerName}
                </Link>
                <span className="text-muted-foreground text-sm">posted a new show</span>
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="More options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>More options</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-0">
          <div className="px-4 pb-3 space-y-2">
            <Link to={`/show/${show.id}`}>
              <h3 className="text-lg font-serif font-bold hover:text-secondary transition-colors leading-tight">
                {show.title}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {show.description}
            </p>
          </div>

          {/* Image */}
          <Link to={`/show/${show.id}`} className="block relative aspect-[4/3] sm:aspect-[16/9] overflow-hidden bg-muted">
             {show.poster_url ? (
                <img
                  src={show.poster_url}
                  alt={show.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    <span className="text-4xl">🎭</span>
                </div>
             )}
             {/* Overlay Gradient */}
             <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60" />

             {/* Badge Overlay */}
             <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                {show.city && (
                    <span className="bg-background/80 backdrop-blur-md text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-secondary/20">
                        <MapPin className="w-3 h-3 text-secondary" />
                        {show.city}
                    </span>
                )}
                {show.date && (
                    <span className="bg-background/80 backdrop-blur-md text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-secondary/20">
                        <Calendar className="w-3 h-3 text-secondary" />
                        {new Date(show.date).toLocaleDateString()}
                    </span>
                )}
             </div>
          </Link>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex flex-col p-0">
            <div className="w-full p-3 flex items-center justify-between border-t border-secondary/10 bg-secondary/5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <FavoriteButton
                            isFavorited={isFavorited(show.id)}
                            onClick={() => toggleFavorite(show.id)}
                            size="sm"
                            className="hover:bg-background/50"
                        />
                        <span className="text-xs text-muted-foreground font-medium">{likeCount}</span>
                    </div>

                    {/* Comments Disabled for Social-First Pivot */}
                    {/* <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowComments(!showComments)}
                            className={`text-muted-foreground hover:text-foreground hover:bg-background/50 gap-1 ${showComments ? 'text-secondary bg-secondary/10' : ''}`}
                            aria-label="View comments"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">{commentCount}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View comments</p>
                      </TooltipContent>
                    </Tooltip> */}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleShare}
                          className="text-muted-foreground hover:text-foreground hover:bg-background/50"
                          aria-label="Share this show"
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share this show</p>
                      </TooltipContent>
                    </Tooltip>
                </div>

                <div className="flex items-center gap-2">
                    <Link to={`/show/${show.id}`}>
                        <Button size="sm" variant="default" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-medium">
                            <Ticket className="w-4 h-4 mr-1" />
                            Get Tickets
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Comments Section Disabled */}
            {/* <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="w-full px-3 pb-3 bg-secondary/5 border-t border-secondary/5"
                    >
                        <CommentSection showId={show.id} />
                    </motion.div>
                )}
            </AnimatePresence> */}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
