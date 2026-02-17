import { useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Download, ExternalLink, Lock, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Show {
  id: string;
  title: string;
}

interface QuickActionsProps {
  onPostShow: () => void;
  onManageEnsemble: () => void;
  shows: Show[];
  profileId: string;
  isTrialExpired: boolean;
}

const ActionCard = forwardRef<HTMLButtonElement | HTMLAnchorElement | HTMLDivElement, {
  icon: any;
  label: string;
  subtext: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: "default" | "primary";
  className?: string;
  [key: string]: any;
}>(({
  icon: Icon,
  label,
  subtext,
  onClick,
  href,
  disabled,
  variant = "default",
  className,
  ...props
}, ref) => {
  const content = (
    <div className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 h-full text-center gap-3 group relative overflow-hidden ${
      disabled
        ? "opacity-50 cursor-not-allowed bg-muted/50 border-muted"
        : "bg-card border-secondary/20 hover:border-primary/50 hover:shadow-lg cursor-pointer"
    } ${className || ""}`}>
      {variant === "primary" && !disabled && (
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
      )}
      <div className={`p-3 rounded-full ${
        disabled
          ? "bg-muted text-muted-foreground"
          : variant === "primary"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary/10 text-secondary group-hover:scale-110 transition-transform duration-200"
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className={`font-semibold ${disabled ? "text-muted-foreground" : "text-foreground"}`}>
          {label}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[120px] mx-auto leading-tight">
          {subtext}
        </p>
      </div>
    </div>
  );

  if (disabled) {
    return <div ref={ref as React.Ref<HTMLDivElement>} className="h-full" {...props}>{content}</div>;
  }

  if (href) {
    return (
      <Link
        to={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full no-underline"
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full h-full text-left p-0 border-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-primary ring-offset-2 rounded-xl"
      ref={ref as React.Ref<HTMLButtonElement>}
      {...props}
    >
      {content}
    </button>
  );
});

ActionCard.displayName = "ActionCard";

export const QuickActions = ({
  onPostShow,
  onManageEnsemble,
  shows,
  profileId,
  isTrialExpired,
}: QuickActionsProps) => {
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async (showId: string, showTitle: string) => {
    if (exporting) return;
    setExporting(true);
    try {
      toast({ title: "Preparing download...", description: `Fetching guest list for ${showTitle}` });

      const { data: guests, error } = await supabase
        .from('tickets')
        .select(`
          id,
          status,
          payment_id,
          created_at,
          user_id,
          profiles:user_id (
            username,
            avatar_url,
            group_name
          )
        `)
        .eq('show_id', showId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!guests || guests.length === 0) {
        toast({ description: "No guests found for this show." });
        return;
      }

      const headers = ["Guest Name", "Ticket ID", "Status", "Payment ID", "Purchase Date"];
      const csvContent = [
        headers.join(","),
        ...guests.map(guest => [
           `"${(guest.profiles as any)?.username || (guest.profiles as any)?.group_name || 'Guest'}"`,
           guest.id,
           guest.status,
           guest.payment_id || "N/A",
           new Date(guest.created_at).toLocaleDateString()
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${showTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_guests.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download started" });
    } catch (e) {
       console.error(e);
       toast({ title: "Error exporting guest list", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl text-foreground">Quick Actions</h2>

      {isTrialExpired && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">
            Your trial has expired. Actions are limited.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Post a Show */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-full">
                <ActionCard
                  icon={isTrialExpired ? Lock : Plus}
                  label="Post a Show"
                  subtext="Create a new production"
                  onClick={onPostShow}
                  disabled={isTrialExpired}
                  variant="primary"
                />
              </div>
            </TooltipTrigger>
            {isTrialExpired && (
              <TooltipContent>
                <p>Trial Expired. Upgrade to post new shows.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Manage Ensemble */}
        <ActionCard
          icon={Users}
          label="Manage Ensemble"
          subtext="Add your cast and crew"
          onClick={onManageEnsemble}
        />

        {/* Export Guest List */}
        <div className="h-full">
          {shows.length > 0 ? (
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <ActionCard
                        icon={Download}
                        label="Export Guest List"
                        subtext="Download CSV of attendees"
                        className={exporting ? "animate-pulse" : ""}
                      />
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select a show to download guest list</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenuContent align="end" className="w-56 bg-popover border-secondary/20">
                <DropdownMenuLabel>Select Show</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {shows.map((show) => (
                  <DropdownMenuItem
                    key={show.id}
                    onClick={() => handleExportCSV(show.id, show.title)}
                    className="cursor-pointer hover:bg-secondary/10"
                  >
                    {show.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-full">
                      <ActionCard
                        icon={Download}
                        label="Export Guest List"
                        subtext="Download CSV of attendees"
                        disabled={true}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>No guests yet</p>
                  </TooltipContent>
                </Tooltip>
             </TooltipProvider>
          )}
        </div>

        {/* Public Preview */}
        <ActionCard
          icon={ExternalLink}
          label="Public Preview"
          subtext="View your producer profile"
          href={`/producer/${profileId}`}
        />
      </div>
    </div>
  );
};
