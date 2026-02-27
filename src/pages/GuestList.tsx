import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { ArrowLeft, Download, Users, QrCode, FileText, Eye, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Guest {
  id: string;
  status: string;
  payment_id: string | null;
  created_at: string;
  checked_in_at: string | null;
  access_code: string | null;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
    group_name: string | null;
  } | null;
  payments: {
    proof_of_payment_url: string | null;
  } | null;
}

interface Show {
  id: string;
  title: string;
  producer_id: string;
  show_time: string | null;
  venue: string | null;
}

const GuestList = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  // Fetch Show Details to verify ownership
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ['show-details', showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select('id, title, producer_id, show_time, venue')
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
          checked_in_at,
          access_code,
          user_id,
          profiles:user_id (
            username,
            avatar_url,
            group_name
          ),
          payments:payment_id (
            proof_of_payment_url
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
      const isProducer = user?.id === show.producer_id || profile?.id === show.producer_id;
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

    const headers = ["Guest Name", "Ticket ID", "Access Code", "Status", "Checked In At", "Payment ID", "Purchase Date"];
    const csvContent = [
      headers.join(","),
      ...guests.map(guest => [
        `"${guest.profiles?.username || guest.profiles?.group_name || 'Guest'}"`,
        guest.id,
        guest.access_code || "",
        guest.status,
        guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString() : "",
        guest.payment_id || "N/A",
        new Date(guest.created_at).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${show?.title.replace(/[^a-z0-9]/gi, '_') || 'Show'}_GuestList.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!guests || guests.length === 0 || !show) {
      toast({ description: "No data to export." });
      return;
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text(show.title, 14, 22);
    doc.setFontSize(12);
    doc.text(`Guest List`, 14, 30);
    if (show.show_time) {
        doc.text(new Date(show.show_time).toLocaleString(), 14, 38);
    }

    // Stats
    const total = guests.length;
    const checkedIn = guests.filter(g => g.status === 'used' || g.checked_in_at).length;
    const confirmed = guests.filter(g => g.status === 'confirmed').length;

    doc.setFontSize(10);
    doc.text(`Total: ${total} | Checked In: ${checkedIn} | Confirmed: ${confirmed}`, 14, 46);

    const tableColumn = ["Guest Name", "Access Code", "Status", "Checked In", "Ticket ID"];
    const tableRows = guests.map(guest => [
        guest.profiles?.username || guest.profiles?.group_name || 'Guest',
        guest.access_code || '-',
        guest.status.toUpperCase(),
        guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleTimeString() : '-',
        guest.id.substring(0, 8) + '...'
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 0] }
    });

    doc.save(`${show.title.replace(/[^a-z0-9]/gi, '_')}_GuestList.pdf`);
  };

  if (authLoading || showLoading || guestsLoading) {
    return <div className="h-screen flex items-center justify-center"><BrandedLoader /></div>;
  }

  if (!show) return <div>Show not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 pt-24 max-w-6xl">
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

          <div className="flex gap-2">
            <Button onClick={() => navigate(`/dashboard/scan/${showId}`)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <QrCode className="w-4 h-4 mr-2" />
                Scan Tickets
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
                <FileText className="w-4 h-4 mr-2" />
                PDF
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
                <Download className="w-4 h-4 mr-2" />
                CSV
            </Button>
          </div>
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
                      <TableHead>Access Code</TableHead>
                      <TableHead>Ticket Status</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead>Checked In</TableHead>
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
                             <div>
                                 <div>{guest.profiles?.username || guest.profiles?.group_name || 'Guest'}</div>
                                 <div className="text-[10px] text-muted-foreground">{guest.id.substring(0,8)}...</div>
                             </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {guest.access_code ? (
                              <span className="bg-muted px-2 py-1 rounded border border-secondary/10">{guest.access_code}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs uppercase border ${
                            guest.status === 'confirmed' || guest.status === 'paid'
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : guest.status === 'used'
                              ? 'bg-muted text-muted-foreground border-muted-foreground/20'
                              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}>
                            {guest.status}
                          </span>
                        </TableCell>
                        <TableCell>
                           {guest.payments?.proof_of_payment_url ? (
                               <Button
                                   variant="ghost"
                                   size="sm"
                                   className="h-8 w-8 p-0"
                                   onClick={() => setSelectedProof(guest.payments!.proof_of_payment_url)}
                               >
                                   <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                               </Button>
                           ) : (
                               <span className="text-muted-foreground text-xs">-</span>
                           )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleTimeString() : '-'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
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
      </main>

      <Dialog open={!!selectedProof} onOpenChange={(open) => !open && setSelectedProof(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Proof of Payment</DialogTitle>
                <DialogDescription className="sr-only">Proof of Payment Image</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
                {selectedProof && (
                    <img
                        src={selectedProof}
                        alt="Proof of Payment"
                        className="max-w-full h-auto rounded-lg border border-secondary/20"
                    />
                )}
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <a href={selectedProof || "#"} target="_blank" rel="noopener noreferrer">
                            Open in New Tab <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default GuestList;
