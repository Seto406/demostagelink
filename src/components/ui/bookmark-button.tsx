import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BookmarkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isBookmarked: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const BookmarkButton = React.forwardRef<HTMLButtonElement, BookmarkButtonProps>(({
  isBookmarked,
  size = 'md',
  className,
  ...props
}, ref) => {
  const sizes = {
    sm: { icon: 16, container: 'h-8 w-8' },
    md: { icon: 20, container: 'h-10 w-10' },
    lg: { icon: 24, container: 'h-12 w-12' }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          ref={ref}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'flex items-center justify-center rounded-full transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            sizes[size].container,
            isBookmarked
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'hover:bg-accent text-muted-foreground hover:text-foreground',
            className
          )}
          {...props}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isBookmarked ? 'bookmarked' : 'unbookmarked'}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Bookmark
                size={sizes[size].icon}
                className={cn(
                  'transition-all duration-200',
                  isBookmarked ? 'fill-current' : 'fill-none'
                )}
              />
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isBookmarked ? 'Remove Bookmark' : 'Bookmark'}</p>
      </TooltipContent>
    </Tooltip>
  );
});
BookmarkButton.displayName = 'BookmarkButton';

export { BookmarkButton };
