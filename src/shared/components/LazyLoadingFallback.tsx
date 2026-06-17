import { Loader2 } from 'lucide-react';

export const LazyFallback = () => (
  <div className="bg-background flex h-screen items-center justify-center">
    <div className="text-center">
      <Loader2 className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);
