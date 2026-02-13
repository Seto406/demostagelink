import React from 'react';
import { Loader2, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MaintenanceMode = ({ retry, error }: { retry?: () => void, error?: Error | null }) => {
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
      </div>

      <p className="mt-8 text-xs text-muted-foreground opacity-50">
        StageLink Infrastructure • v1.0
      </p>
    </div>
  );
};
