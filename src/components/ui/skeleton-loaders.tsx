import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

// Base shimmer skeleton with enhanced animation
export const ShimmerSkeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm bg-muted",
        className
      )}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"
        animate={{
          translateX: ["−100%", "100%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

// Show card skeleton
export const ShowCardSkeleton = () => {
  return (
    <div className="group relative overflow-hidden border border-secondary/20 bg-card">
      {/* Poster skeleton */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <ShimmerSkeleton className="absolute inset-0" />
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <ShimmerSkeleton className="h-5 w-3/4" />
        
        {/* Date & venue */}
        <div className="space-y-2">
          <ShimmerSkeleton className="h-4 w-1/2" />
          <ShimmerSkeleton className="h-4 w-2/3" />
        </div>
        
        {/* Badge */}
        <ShimmerSkeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
};

// Producer card skeleton
export const ProducerCardSkeleton = () => {
  return (
    <div className="border border-secondary/20 bg-card p-6 space-y-4">
      {/* Avatar and name */}
      <div className="flex items-center gap-4">
        <ShimmerSkeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <ShimmerSkeleton className="h-5 w-3/4" />
          <ShimmerSkeleton className="h-4 w-1/2" />
        </div>
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <ShimmerSkeleton className="h-4 w-full" />
        <ShimmerSkeleton className="h-4 w-5/6" />
        <ShimmerSkeleton className="h-4 w-2/3" />
      </div>
      
      {/* Stats */}
      <div className="flex gap-4">
        <ShimmerSkeleton className="h-8 w-20" />
        <ShimmerSkeleton className="h-8 w-24" />
      </div>
    </div>
  );
};

// Profile header skeleton
export const ProfileHeaderSkeleton = () => {
  return (
    <div className="space-y-6 p-6 border border-secondary/20 bg-card">
      {/* Cover image */}
      <ShimmerSkeleton className="h-48 w-full" />
      
      {/* Profile info */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <ShimmerSkeleton className="w-24 h-24 rounded-full -mt-12" />
        <div className="flex-1 space-y-3">
          <ShimmerSkeleton className="h-8 w-1/3" />
          <ShimmerSkeleton className="h-4 w-1/4" />
          <div className="space-y-2 pt-2">
            <ShimmerSkeleton className="h-4 w-full" />
            <ShimmerSkeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Table row skeleton
export const TableRowSkeleton = ({ columns = 4 }: { columns?: number }) => {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/10">
      {Array.from({ length: columns }).map((_, i) => (
        <ShimmerSkeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-32" : i === columns - 1 ? "w-20" : "flex-1"
          )}
        />
      ))}
    </div>
  );
};

// Stats card skeleton
export const StatsCardSkeleton = () => {
  return (
    <div className="border border-secondary/20 bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <ShimmerSkeleton className="h-4 w-24" />
        <ShimmerSkeleton className="h-8 w-8 rounded" />
      </div>
      <ShimmerSkeleton className="h-8 w-16" />
      <ShimmerSkeleton className="h-3 w-20" />
    </div>
  );
};

// Form skeleton
export const FormSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Form fields */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <ShimmerSkeleton className="h-4 w-24" />
          <ShimmerSkeleton className="h-10 w-full" />
        </div>
      ))}
      
      {/* Button */}
      <ShimmerSkeleton className="h-10 w-32" />
    </div>
  );
};

// Grid skeleton for shows/cards
export const ShowGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <ShowCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

// List skeleton for producers
export const ProducerListSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <ProducerCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

// Hero section skeleton
export const HeroSkeleton = () => {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <ShimmerSkeleton className="h-16 w-3/4 mx-auto" />
        <ShimmerSkeleton className="h-6 w-1/2 mx-auto" />
        <div className="flex gap-4 justify-center pt-4">
          <ShimmerSkeleton className="h-12 w-36" />
          <ShimmerSkeleton className="h-12 w-36" />
        </div>
      </div>
    </div>
  );
};

export default ShimmerSkeleton;
