import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";
import { Loader2, Check, X, ExternalLink, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

type ManualPayment = {
  id: string;
  amount: number;
  created_at: string;
  proof_of_payment_url: string | null;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  description: string | null;
  profiles?: {
    username: string | null;
    email: string | null;
  } | {
    username: string | null;
    email: string | null;
  }[] | null;
  tickets?: {
      customer_name: string | null;
      customer_email: string | null;
      shows?: {
          title: string | null;
      } | null;
  }[] | null;
};

export function PaymentApprovals() {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          profiles (username, email),
          tickets:tickets!payment_id (
            customer_name,
            customer_email,
            shows (title)
          )
        `)
        .eq("status", "pending")
        .eq("payment_method", "manual")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments((data as unknown) as ManualPayment[]);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load pending payments.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (paymentId: string, action: 'approve' | 'reject') => {
    setProcessingId(paymentId);
    try {
        const { error } = await supabase.functions.invoke("approve-manual-payment", {
            body: { payment_id: paymentId, action }
        });

        if (error) throw error;

        toast.success(`Payment ${action}d successfully.`);
        setPayments(prev => prev.filter(p => p.id !== paymentId));

        // Notify user if possible
        const payment = payments.find(p => p.id === paymentId);
        if (payment && payment.user_id) {
             const message = action === 'approve'
                ? "Your manual payment has been verified and approved."
                : "Your manual payment could not be verified. Please check your email.";

             await createNotification({
                 userId: payment.user_id,
                 type: action === 'approve' ? 'payment_approved' : 'payment_rejected',
                 title: action === 'approve' ? "Payment Verified" : "Payment Issue",
                 message: message,
                 link: "/profile?tab=passes"
             });
        }

    } catch (error) {
        console.error(`Error ${action}ing payment:`, error);
        toast.error(`Failed to ${action} payment.`);
    } finally {
        setProcessingId(null);
    }
  };

  const getDisplayInfo = (payment: ManualPayment) => {
    // Priority: Guest Info in Ticket -> Guest Info in Payment -> Profile Info
    const ticket = payment.tickets?.[0];

    // Safely get profile info (could be object or array)
    let profileName = "Guest";
    let profileEmail = "No Email";

    if (payment.profiles) {
        if (Array.isArray(payment.profiles)) {
            profileName = payment.profiles[0]?.username || "Guest";
            profileEmail = payment.profiles[0]?.email || "No Email";
        } else {
            profileName = payment.profiles.username || "Guest";
            profileEmail = payment.profiles.email || "No Email";
        }
    }

    const name = ticket?.customer_name || payment.customer_name || profileName;
    const email = ticket?.customer_email || payment.customer_email || profileEmail;
    const showTitle = ticket?.shows?.title || payment.description || "Unknown Show";

    return { name, email, showTitle };
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Payment Approvals</CardTitle>
          <CardDescription>
            Review and verify manual payments submitted by users.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No pending manual payments found.
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User / Guest</TableHead>
                                <TableHead>Show</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Proof</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.map((payment) => {
                                const { name, email, showTitle } = getDisplayInfo(payment);
                                return (
                                    <TableRow key={payment.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {format(new Date(payment.created_at), "MMM d, yyyy HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{name}</span>
                                                <span className="text-xs text-muted-foreground">{email}</span>
                                                {payment.user_id && <span className="text-[10px] bg-secondary/10 text-secondary px-1 rounded w-fit">Registered</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{showTitle}</TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(payment.amount / 100)}
                                        </TableCell>
                                        <TableCell>
                                            {payment.proof_of_payment_url ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => setSelectedProof(payment.proof_of_payment_url)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Button>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">No Proof</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    disabled={processingId === payment.id}
                                                    onClick={() => handleAction(payment.id, 'approve')}
                                                >
                                                    {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={processingId === payment.id}
                                                    onClick={() => handleAction(payment.id, 'reject')}
                                                >
                                                    {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>

      {/* Proof Modal */}
      <Dialog open={!!selectedProof} onOpenChange={(open) => !open && setSelectedProof(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Proof of Payment</DialogTitle>
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
    </div>
  );
}
