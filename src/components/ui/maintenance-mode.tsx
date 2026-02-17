import React, { useState, useEffect } from 'react';
import { Loader2, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { performNuclearWipe } from '@/lib/cleanupStorage';

export const MaintenanceMode = ({ retry, error }: { retry?: () => void, error?: Error | null }) => {
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReset(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="bg-card border border-secondary/20 p-8 rounded-2xl max-w-md w-full shadow-lg">
        <div className="mb-6 flex justify-center">
            {error ? (
                 <ServerCrash className="w-16 h-16 text-destructive" />
            ) : (
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                    <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                </div>
            )}
        </div>

        <h1 className="text-2xl font-serif font-bold mb-2">
            {error ? "Connection Issue" : "System Updating"}
        </h1>

        <p className="text-muted-foreground mb-6">
            {error
                ? "We're having trouble connecting to our servers. This might be a temporary network issue."
                : "We are currently syncing the latest updates to the database. This should only take a moment."
            }
        </p>

        {retry && (
          <Button onClick={retry} variant="outline" className="w-full">
            Retry Connection
          </Button>
        )}

        {showReset && (
          <Button
            onClick={performNuclearWipe}
            variant="ghost"
            className="w-full mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Manual Reset
          </Button>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground opacity-50">
        StageLink Infrastructure • v1.0
      </p>
    </div>
  );
};
