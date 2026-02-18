import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Mail, Check, X, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AudienceLink {
  id: string;
  audience_user_id: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  audience_email?: string;
}

interface AudienceLinkingProps {
  isPro?: boolean;
}

export function AudienceLinking({ isPro = false }: AudienceLinkingProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [links, setLinks] = useState<AudienceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const fetchLinks = async () => {
      if (!profile?.id) return;
      if (!isPro) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("group_audience_links")
          .select("*")
          .eq("group_id", profile.id)
          .order("invited_at", { ascending: false });

        if (error) throw error;
        setLinks(data || []);
      } catch (error) {
        console.error("Error fetching audience links:", error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.id) {
      fetchLinks();
    }
  }, [profile?.id, isPro]);

  const inviteAudience = async () => {
    if (!inviteEmail.trim() || !profile?.id) return;
    
    setInviting(true);
    try {
      // Find user by email (we'd need to look up the user)
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("role", "audience")
        .limit(1)
        .maybeSingle();

      // For now, we'll create a placeholder - in production, you'd verify the email
      toast.info("Audience linking requires the user to have an account. Share your group link instead!");
      setInviteEmail("");
    } catch (error) {
      console.error("Error inviting audience:", error);
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const removeLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from("group_audience_links")
        .delete()
        .eq("id", linkId);

      if (error) throw error;
      
      setLinks(links.filter(l => l.id !== linkId));
      toast.success("Link removed");
    } catch (error) {
      console.error("Error removing link:", error);
      toast.error("Failed to remove link");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Accepted</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "declined":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!isPro) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-secondary/10 p-4 rounded-full mb-4">
            <Lock className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="font-serif text-2xl font-bold mb-2">Audience Linking Locked</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Directly connect with your most loyal fans! Upgrade to Pro to invite audience members and verify their attendance.
          </p>
          <Button onClick={() => navigate("/settings")} variant="default" size="lg">
            Upgrade to Pro
          </Button>
        </div>

        {/* Placeholder Content */}
        <CardHeader className="opacity-20 filter blur-sm">
           <CardTitle className="flex items-center gap-2 text-lg">
             <Users className="h-5 w-5 text-primary" />
             Linked Audience Members
           </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 opacity-20 filter blur-sm">
           <div className="flex gap-2">
             <Input placeholder="Enter audience email to invite..." disabled />
             <Button disabled size="sm">
               <UserPlus className="h-4 w-4 mr-1" />
               Invite
             </Button>
           </div>
           <div className="h-20 bg-muted/20 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Linked Audience Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite Section */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter audience email to invite..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={inviteAudience} 
            disabled={inviting || !inviteEmail.trim()}
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Invite
          </Button>
        </div>

        {/* Linked Members List */}
        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No linked audience members yet</p>
            <p className="text-sm mt-1">Invite audience members to connect with your group</p>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {link.audience_email || `User ${link.audience_user_id.slice(0, 8)}...`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Invited {new Date(link.invited_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(link.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLink(link.id)}
                    aria-label="Remove audience member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
