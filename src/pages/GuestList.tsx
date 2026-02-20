import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { ArrowLeft, Download, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/layout/Footer";

interface Guest {
  id: string;
  status: string;
  payment_id: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
    group_name: string | null;
  } | null;
}

interface Show {
  id: string;
  title: string;
  producer_id: string;
}

const GuestList = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  // Fetch Show Details to verify ownership
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ['show-details', showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select('id, title, producer_id')
        .eq('id', showId)
        .single();

      if (error) throw error;
      return data as Show;
    },
    enabled: !!showId
  });

  // Fetch Tickets/Guests
  const { data: guests, isLoading: guestsLoading } = useQuery({
    queryKey: ['show-guests', showId],
    queryFn: async () => {
      const { data, error } = await supabase
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
      return data as Guest[];
    },
    enabled: !!showId && !!show // Wait for show check
  });

  // Access Control
  useEffect(() => {
    if (!authLoading && !showLoading && show) {
      const isProducer = user?.id === show.producer_id;
      const isAdmin = profile?.role === 'admin';

      if (!isProducer && !isAdmin) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to view this guest list.",
          variant: "destructive"
        });
        navigate("/dashboard");
      }
    }
  }, [authLoading, showLoading, show, user, profile, navigate]);

  const handleExportCSV = () => {
    if (!guests || guests.length === 0) {
      toast({ description: "No guests to export." });
      return;
    }

    const headers = ["Guest Name", "Ticket ID", "Status", "Payment ID", "Purchase Date"];
    const csvContent = [
      headers.join(","),
      ...guests.map(guest => [
        `"${guest.profiles?.username || guest.profiles?.group_name || 'Guest'}"`,
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
    link.setAttribute("download", `${show?.title || 'Show'}_GuestList.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading || showLoading || guestsLoading) {
    return <div className="h-screen flex items-center justify-center"><BrandedLoader /></div>;
  }

  if (!show) return <div>Show not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-8 pt-6 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-secondary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Guest List</h1>
            <p className="text-muted-foreground">
              Managing guests for <span className="text-foreground font-medium">{show.title}</span>
            </p>
          </div>

          <Button onClick={handleExportCSV} variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="w-5 h-5 text-secondary" />
              Confirmed Guests ({guests?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {guests && guests.length > 0 ? (
              <div className="rounded-md border border-secondary/20 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Guest Name</TableHead>
                      <TableHead>Ticket Status</TableHead>
                      <TableHead className="hidden md:table-cell">Payment ID</TableHead>
                      <TableHead className="text-right">Purchase Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.map((guest) => (
                      <TableRow key={guest.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-xs">
                                {(guest.profiles?.username?.[0] || 'G').toUpperCase()}
                             </div>
                             {guest.profiles?.username || guest.profiles?.group_name || 'Guest'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs uppercase border ${
                            guest.status === 'confirmed' || guest.status === 'paid'
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}>
                            {guest.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">
                          {guest.payment_id || '-'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Date(guest.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No tickets sold yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default GuestList;
