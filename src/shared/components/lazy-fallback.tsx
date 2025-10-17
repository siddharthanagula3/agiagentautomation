import { Loader2 } from 'lucide-react';

export const LazyFallback = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="text-center">
      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);
