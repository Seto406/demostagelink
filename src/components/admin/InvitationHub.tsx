import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, User, Send, RefreshCw } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  first_name: string | null;
  status: "pending" | "accepted" | "expired";
  invited_at: string;
  accepted_at: string | null;
}

interface InvitationStats {
  pending: number;
  accepted: number;
  expired: number;
}

export function InvitationHub() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats>({ pending: 0, accepted: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ email: "", firstName: "" });

  useEffect(() => {
    fetchInvitations();

    // Realtime subscription
    const channel = supabase
      .channel("invitations-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invitations",
        },
        (payload) => {
          fetchInvitations(); // Refresh on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .order("invited_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setInvitations(data as Invitation[]);

        // Calculate stats
        const newStats = data.reduce(
          (acc, inv) => {
            acc[inv.status as keyof InvitationStats] = (acc[inv.status as keyof InvitationStats] || 0) + 1;
            return acc;
          },
          { pending: 0, accepted: 0, expired: 0 } as InvitationStats
        );
        setStats(newStats);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast({
        title: "Error",
        description: "Failed to load invitations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.firstName) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and first name.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: formData.email,
          first_name: formData.firstName,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Invitation Sent",
        description: `Successfully invited ${formData.firstName} (${formData.email})`,
      });

      setFormData({ email: "", firstName: "" });
      fetchInvitations(); // Refresh list immediately
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast({
        title: "Invitation Failed",
        description: error.message || "Could not send invitation.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Accepted</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">Pending</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Section: The Invitation Hub */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">The Invitation Hub</h2>
          <p className="text-muted-foreground">Manage and track user invitations to StageLink.</p>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-4">
            <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-lg p-3 min-w-[100px] flex flex-col items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Pending</span>
                <span className="text-xl font-bold text-yellow-500">{stats.pending || 0}</span>
            </div>
            <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-lg p-3 min-w-[100px] flex flex-col items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Accepted</span>
                <span className="text-xl font-bold text-green-500">{stats.accepted || 0}</span>
            </div>
             <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-lg p-3 min-w-[100px] flex flex-col items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Expired</span>
                <span className="text-xl font-bold text-red-500">{stats.expired || 0}</span>
            </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Invite Form */}
        <Card className="md:col-span-4 bg-card/50 backdrop-blur-sm border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
            <CardDescription>Send an exclusive invitation to join StageLink.</CardDescription>
          </CardHeader>
          <form onSubmit={handleInvite}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="First Name"
                    className="pl-9 bg-background/50 border-white/10 focus:border-primary/50 transition-all"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    className="pl-9 bg-background/50 border-white/10 focus:border-primary/50 transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Active Invites Table */}
        <Card className="md:col-span-8 bg-card/50 backdrop-blur-sm border-white/10 shadow-lg overflow-hidden">
          <CardHeader>
            <CardTitle>Active Invites</CardTitle>
            <CardDescription>Recent invitations and their status.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
                <Table>
                <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="w-[200px]">Recipient Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Sent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Loading invitations...
                            </TableCell>
                        </TableRow>
                    ) : invitations.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No invitations sent yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invitations.map((invitation) => (
                            <TableRow key={invitation.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                <TableCell className="font-medium">{invitation.first_name || "Unknown"}</TableCell>
                                <TableCell>{invitation.email}</TableCell>
                                <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(invitation.invited_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    {invitation.status === "pending" && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setFormData({ email: invitation.email, firstName: invitation.first_name || "" });
                                            }}
                                            className="text-primary hover:text-primary hover:bg-primary/10"
                                        >
                                            Resend
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
