import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'table';
  count?: number;
}

export function LoadingSkeleton({ 
  className, 
  variant = 'text',
  count = 1 
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const baseClasses = 'animate-pulse bg-white/5 rounded';

  const variantClasses = {
    text: 'h-4 w-full',
    card: 'h-32 w-full',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24',
    table: 'h-16 w-full',
  };

  return (
    <>
      {skeletons.map((i) => (
        <div
          key={i}
          className={cn(
            baseClasses,
            variantClasses[variant],
            className
          )}
          role="status"
          aria-label="Loading..."
        />
      ))}
    </>
  );
}

// Specific skeleton components for common use cases
export function AgentCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
      <div className="flex items-start gap-4">
        <LoadingSkeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton className="h-6 w-3/4" />
          <LoadingSkeleton className="h-4 w-1/2" />
        </div>
      </div>
      <LoadingSkeleton variant="text" count={3} className="space-y-2" />
      <div className="flex gap-2">
        <LoadingSkeleton variant="button" />
        <LoadingSkeleton variant="button" />
      </div>
    </div>
  );
}

export function SkillCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-5 w-32" />
        <LoadingSkeleton className="h-6 w-16 rounded-full" />
      </div>
      <LoadingSkeleton variant="text" count={2} />
      <div className="flex gap-2">
        <LoadingSkeleton className="h-8 w-20" />
        <LoadingSkeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <LoadingSkeleton variant="table" count={rows} />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="h-24 w-full" />
      </div>
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-28" />
        <LoadingSkeleton className="h-10 w-full" />
      </div>
      <LoadingSkeleton variant="button" className="w-full" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-64" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AgentCardSkeleton />
        <AgentCardSkeleton />
        <AgentCardSkeleton />
      </div>
    </div>
  );
}

// Made with Moe Abdelaziz
