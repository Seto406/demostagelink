import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Calendar, Share2, MessageCircle, MoreHorizontal, Ticket, Pencil, Users, Archive, Undo } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { LikeButton } from "@/components/ui/like-button";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/use-favorites";
import { useShowLikes } from "@/hooks/use-show-likes";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { CommentSection } from "@/components/feed/CommentSection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";

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
    price?: number | null;
    ticket_link?: string | null;
    status?: string;
    is_premium?: boolean;
    producer_id?: {
      group_name: string | null;
      id: string;
      avatar_url: string | null;
      group_logo_url: string | null;
    };
    show_likes?: { count: number }[];
    favorites?: { count: number }[]; // Keep for backward compatibility if needed, but we'll use show_likes for display
  };
  dataTour?: string;
}

export function FeedPost({ show, dataTour }: FeedPostProps) {
  const { user, profile, loading } = useAuth();
  const { toggleFavorite, isFavorited } = useFavorites();
  const { toggleLike, isLiked } = useShowLikes();
  const [showComments, setShowComments] = useState(false);

  // Use show_likes for the count if available, otherwise 0
  const [likeCount, setLikeCount] = useState(show.show_likes?.[0]?.count || 0);
  const [commentCount, setCommentCount] = useState(0);
  const [reservationCount, setReservationCount] = useState(0);
  const queryClient = useQueryClient();

  const isProducerOrAdmin = !loading && user && (profile?.id === show.producer_id?.id || profile?.role === 'admin');
  const producerName = show.producer_id?.group_name || "Unknown Group";
  const producerAvatar = show.producer_id?.group_logo_url;
  const isPremium = show.is_premium;
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
    // Count from show_likes table
    const { count } = await supabase
      .from('show_likes')
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
    fetchLikeCount();
    // Subscriptions for real-time counts
    const likeChannel = supabase.channel(`show_likes-${show.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'show_likes', filter: `show_id=eq.${show.id}` }, () => {
         fetchLikeCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(likeChannel);
    };
  }, [show.id, fetchLikeCount]);

  useEffect(() => {
    if (isProducerOrAdmin) {
      supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('show_id', show.id)
        .then(({ count }) => {
          if (count !== null) setReservationCount(count);
        });
    }
  }, [isProducerOrAdmin, show.id]);

  const estimatedRevenue = reservationCount * (show.price || 0);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/show/${show.id}`);
    toast({
      title: "Link copied",
      description: "Show link copied to clipboard.",
    });
  };

  const handleArchive = async () => {
    try {
      const { error } = await supabase
        .from('shows')
        .update({ status: 'archived', deleted_at: new Date().toISOString() })
        .eq('id', show.id);

      if (error) throw error;

      toast({
        title: "Show Archived",
        description: "This show has been moved to your archive.",
      });

      queryClient.invalidateQueries({ queryKey: ['approved-shows'] });
      queryClient.invalidateQueries({ queryKey: ['producer-shows'] });
      queryClient.invalidateQueries({ queryKey: ['producer-recent-shows'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive show.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async () => {
    try {
      const { error } = await supabase
        .from('shows')
        .update({ status: 'approved', deleted_at: null })
        .eq('id', show.id);

      if (error) throw error;

      toast({
        title: "Show Restored",
        description: "This show is now visible on the feed.",
      });

      queryClient.invalidateQueries({ queryKey: ['approved-shows'] });
      queryClient.invalidateQueries({ queryKey: ['producer-shows'] });
      queryClient.invalidateQueries({ queryKey: ['producer-recent-shows'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore show.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn(
        "border-secondary/20 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-secondary/40 transition-colors",
        isPremium && "border-primary/50 shadow-[0_0_20px_hsl(43_72%_52%/0.1)] ring-1 ring-primary/30"
      )}>
        {/* Header */}
        <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <Link to={`/producer/${show.producer_id?.id}`} className="hover:opacity-80 transition-opacity">
              <Avatar className={cn(
                  "h-10 w-10 border border-secondary/30",
                  isPremium && "border-primary/50 ring-2 ring-primary/20"
              )}>
                <AvatarImage src={producerAvatar || undefined} alt={producerName} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <Link to={`/producer/${show.producer_id?.id}`} className="font-semibold text-sm hover:underline">
                  {producerName}
                </Link>
                {isPremium && (
                    <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary hover:bg-primary/30 text-[9px] px-1.5 py-0 border-primary/20 h-4 shadow-[0_0_8px_hsl(43_72%_52%/0.3)] animate-pulse-glow">
                        PRO
                    </Badge>
                )}
                <span className="text-muted-foreground text-sm">posted a new show</span>
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isProducerOrAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to={`/dashboard?tab=shows&edit=${show.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Edit Production">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Production</p>
                </TooltipContent>
              </Tooltip>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isProducerOrAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/guests/${show.id}`} className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        <span>View Guest List</span>
                      </Link>
                    </DropdownMenuItem>

                    {show.status === 'archived' ? (
                      <DropdownMenuItem onClick={handleRestore} className="cursor-pointer">
                        <Undo className="mr-2 h-4 w-4" />
                        <span>Restore Show</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={handleArchive} className="cursor-pointer text-destructive focus:text-destructive">
                        <Archive className="mr-2 h-4 w-4" />
                        <span>Archive Show</span>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                  <Share2 className="mr-2 h-4 w-4" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
          <Link to={`/show/${show.id}`} className="block relative w-full overflow-hidden bg-black group max-h-[600px]">
             {isProducerOrAdmin && (
                <div className="absolute top-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white p-2 text-xs flex justify-between z-20 font-mono">
                   <span>Reservations: {reservationCount}</span>
                   <span>Est. Rev: {formatCurrency(estimatedRevenue)}</span>
                </div>
             )}
             {show.poster_url ? (
                <>
                   <div
                      className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                      style={{ backgroundImage: `url(${show.poster_url})` }}
                   />
                   <img
                     src={show.poster_url}
                     alt={show.title}
                     className="relative w-full h-auto object-contain max-h-[600px] z-10 transition-transform duration-500 group-hover:scale-[1.02] mx-auto"
                   />
                </>
             ) : (
                <div className="w-full aspect-video flex items-center justify-center bg-muted text-muted-foreground">
                    <span className="text-4xl">🎭</span>
                </div>
             )}
             {/* Overlay Gradient */}
             <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60 z-10 pointer-events-none" />

             {/* Badge Overlay */}
             <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 z-20">
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
            <div
              className="w-full p-3 flex items-center justify-between border-t border-secondary/10 bg-secondary/5"
              data-tour={dataTour}
            >
                <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleShare}
                          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-full flex items-center justify-center transition-all bg-background/80 backdrop-blur-sm border border-secondary/30 hover:border-primary/50 hover:bg-background/90"
                          aria-label="Share this show"
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share this show</p>
                      </TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-1">
                        <LikeButton
                            isLiked={isLiked(show.id)}
                            onClick={() => {
                                const currentlyLiked = isLiked(show.id);
                                setLikeCount(prev => currentlyLiked ? Math.max(0, prev - 1) : prev + 1);
                                toggleLike(show.id, show.producer_id?.id);
                            }}
                            size="sm"
                            className="hover:bg-background/50 h-8 w-8 p-0"
                        />
                        <span className="text-xs text-muted-foreground font-medium">{likeCount}</span>
                    </div>

                    <BookmarkButton
                        isFavorited={isFavorited(show.id)}
                        onClick={() => {
                            const willFavorite = !isFavorited(show.id);
                            toggleFavorite(show.id);
                            toast({
                                title: willFavorite ? "Added to Favorites" : "Removed from Favorites",
                                description: willFavorite ? "This show has been added to your favorites." : "This show has been removed from your favorites.",
                            });
                        }}
                        size="sm"
                        className="hover:bg-background/50 h-8 w-8 p-0"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Link to={`/show/${show.id}`}>
                        {(show.price !== null && show.price !== undefined && show.price >= 0) ? (
                            show.price === 0 ? (
                                <Button size="sm" variant="default" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium">
                                    <Ticket className="w-4 h-4 mr-1" />
                                    Get Free Ticket
                                </Button>
                            ) : (
                                <Button size="sm" variant="default" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-medium">
                                    <Ticket className="w-4 h-4 mr-1" />
                                    Reserve for ₱25
                                </Button>
                            )
                        ) : show.ticket_link ? (
                            <Button size="sm" variant="default" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-medium">
                                <Ticket className="w-4 h-4 mr-1" />
                                Get Tickets
                            </Button>
                        ) : (
                            <Button size="sm" variant="secondary" disabled>
                                Unavailable
                            </Button>
                        )}
                    </Link>
                </div>
            </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
