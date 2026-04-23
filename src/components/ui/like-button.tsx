import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LikeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLiked: boolean;
  likeCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const LikeButton = React.forwardRef<HTMLButtonElement, LikeButtonProps>(({
  isLiked,
  likeCount = 0,
  size = 'md',
  showCount = true,
  className,
  ...props
}, ref) => {
  const sizes = {
    sm: { icon: 16, container: 'h-8' },
    md: { icon: 20, container: 'h-10' },
    lg: { icon: 24, container: 'h-12' }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          ref={ref}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            sizes[size].container,
            isLiked
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              : 'hover:bg-accent text-muted-foreground hover:text-foreground',
            className
          )}
          {...props}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isLiked ? 'liked' : 'unliked'}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Heart
                size={sizes[size].icon}
                className={cn(
                  'transition-all duration-200',
                  isLiked ? 'fill-current' : 'fill-none'
                )}
              />
            </motion.div>
          </AnimatePresence>
          {showCount && likeCount > 0 && (
            <motion.span
              key={likeCount}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'text-sm font-medium tabular-nums',
                size === 'sm' && 'text-xs'
              )}
            >
              {likeCount}
            </motion.span>
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isLiked ? 'Unlike' : 'Like'}</p>
      </TooltipContent>
    </Tooltip>
  );
});
LikeButton.displayName = 'LikeButton';

export { LikeButton };
