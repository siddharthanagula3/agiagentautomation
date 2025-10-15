import { Skeleton } from '@shared/ui/skeleton';

export const PageSkeleton = () => (
  <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
    <Skeleton className="h-12 w-3/4" />
    <Skeleton className="h-6 w-1/2" />
    <div className="mt-8 space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    <Skeleton className="h-8 w-48" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  </div>
);

export const ChatSkeleton = () => (
  <div className="flex h-[600px] flex-col">
    <Skeleton className="h-16 border-b" />
    <div className="flex-1 space-y-4 p-4">
      <Skeleton className="h-20 w-2/3" />
      <Skeleton className="ml-auto h-20 w-3/4" />
      <Skeleton className="h-20 w-2/3" />
    </div>
    <Skeleton className="h-16 border-t" />
  </div>
);

export const TableSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

export const CardGridSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Skeleton className="h-64" />
    <Skeleton className="h-64" />
    <Skeleton className="h-64" />
  </div>
);
