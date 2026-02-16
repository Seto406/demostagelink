import { useEffect, useState } from "react";
import { CheckSquare, Square, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface OnboardingChecklistProps {
  profile: any;
  hasShows: boolean;
}

export const OnboardingChecklist = ({ profile, hasShows }: OnboardingChecklistProps) => {
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!profile?.id) return;
      const { count, error } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", profile.id);

      if (!error) {
        setMemberCount(count || 0);
      }
      setLoading(false);
    };

    fetchMembers();
  }, [profile?.id]);

  const hasProfile = !!(profile?.group_name && profile?.description && profile?.avatar_url);
  const hasMembers = memberCount > 0;

  const steps = [
    {
      id: "profile",
      label: "Complete Group Profile",
      isComplete: hasProfile,
      link: "/dashboard?tab=profile"
    },
    {
      id: "production",
      label: "Post your first Production",
      isComplete: hasShows,
      link: "/dashboard?tab=shows"
    },
    {
      id: "invite",
      label: "Invite your first Member",
      isComplete: hasMembers,
      link: "/dashboard?tab=members"
    }
  ];

  if (hasProfile && hasShows && hasMembers) return null; // Hide if all done? Or show 100%?
  // Let's keep it visible but maybe minimized or "All set!" message?
  // User asked for "Active Progress Trackers". Usually if done, it disappears or shows 100%.
  // I will keep it visible for now with all checked.

  return (
    <Card className="bg-card border-secondary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif">Onboarding Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center justify-between group">
             <div className="flex items-center gap-3">
               {step.isComplete ? (
                 <CheckSquare className="w-5 h-5 text-green-500" />
               ) : (
                 <Square className="w-5 h-5 text-muted-foreground" />
               )}
               <span className={`text-sm ${step.isComplete ? "text-muted-foreground line-through decoration-secondary/50" : "text-foreground"}`}>
                 {step.label}
               </span>
             </div>
             {!step.isComplete && step.link && (
               <Link
                 to={step.link}
                 className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 Go <ChevronRight className="w-3 h-3" />
               </Link>
             )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
