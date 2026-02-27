import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface EditRequest {
  id: string;
  show_id: string;
  producer_id: string;
  changes: Json;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  shows?: {
    title: string;
    poster_url: string | null;
  };
  profiles?: {
    group_name: string | null;
  };
}

// Helper to render changes nicely
const ChangeDiff = ({ changes, originalShow }: { changes: any, originalShow: any }) => {
  const keys = Object.keys(changes);

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {keys.map((key) => {
        const newValue = changes[key];
        const oldValue = originalShow ? originalShow[key] : "Loading...";

        // Skip complex objects for simple diff for now, or stringify them
        const displayNew = typeof newValue === 'object' ? JSON.stringify(newValue, null, 2) : String(newValue);
        const displayOld = typeof oldValue === 'object' ? JSON.stringify(oldValue, null, 2) : String(oldValue);

        if (displayNew === displayOld) return null; // Should not happen if changes only stores diffs, but good safety

        return (
          <div key={key} className="grid grid-cols-[1fr,auto,1fr] gap-2 items-start border-b border-secondary/10 pb-2">
            <div className="bg-red-500/10 p-2 rounded text-sm text-red-700 dark:text-red-300 break-words">
              <p className="text-xs font-bold uppercase text-red-500 mb-1">{key} (Old)</p>
              <pre className="whitespace-pre-wrap font-sans">{displayOld}</pre>
            </div>
            <div className="flex items-center justify-center h-full text-muted-foreground">
               <ArrowRight className="w-4 h-4" />
            </div>
            <div className="bg-green-500/10 p-2 rounded text-sm text-green-700 dark:text-green-300 break-words">
              <p className="text-xs font-bold uppercase text-green-500 mb-1">{key} (New)</p>
               <pre className="whitespace-pre-wrap font-sans">{displayNew}</pre>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const EditRequests = () => {
  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null);
  const [originalShow, setOriginalShow] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("show_edit_requests")
      .select(`
        *,
        shows (
          title,
          poster_url
        ),
        profiles (
          group_name
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching edit requests:", error);
    } else {
      setRequests(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleViewRequest = async (request: EditRequest) => {
    setSelectedRequest(request);
    // Fetch the original show data for comparison
    const { data } = await supabase
      .from("shows")
      .select("*")
      .eq("id", request.show_id)
      .single();
    setOriginalShow(data);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const { error } = await supabase.rpc("approve_show_edit_request", {
        request_id: selectedRequest.id,
      });

      if (error) throw error;

      toast({
        title: "Request Approved",
        description: "The show has been updated successfully.",
      });

      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setSelectedRequest(null);
    } catch (error: any) {
      console.error("Approval error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve request.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
      if (!selectedRequest) return;
      const feedback = prompt("Enter reason for rejection (optional):");
      if (feedback === null) return; // Cancelled

      setProcessing(true);
      try {
        const { error } = await supabase.rpc("reject_show_edit_request", {
            request_id: selectedRequest.id,
            feedback: feedback || null
        });

        if (error) throw error;

        toast({
            title: "Request Rejected",
            description: "The producer has been notified.",
        });

        setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
        setSelectedRequest(null);
      } catch (error: any) {
          console.error("Rejection error:", error);
          toast({
            title: "Error",
            description: error.message || "Failed to reject request.",
            variant: "destructive",
          });
      } finally {
          setProcessing(false);
      }
  };

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-secondary/20 rounded-xl">
        <p className="text-muted-foreground">No pending edit requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 bg-card border border-secondary/20 rounded-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-16 bg-muted rounded overflow-hidden">
                {request.shows?.poster_url ? (
                  <img src={request.shows.poster_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary/10" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-foreground">{request.shows?.title || "Unknown Show"}</h3>
                <p className="text-sm text-muted-foreground">
                  by {request.profiles?.group_name || "Unknown Producer"} • {format(new Date(request.created_at), "MMM d, h:mm a")}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleViewRequest(request)}>
              <Eye className="w-4 h-4 mr-2" />
              Review Changes
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={(val) => !val && setSelectedRequest(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Review Edit Request</DialogTitle>
            <DialogDescription>
              Compare the requested changes with the live version.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && originalShow && (
             <ChangeDiff changes={selectedRequest.changes} originalShow={originalShow} />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary/10">
            <Button variant="ghost" onClick={() => setSelectedRequest(null)}>Cancel</Button>
            <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing}
            >
                <X className="w-4 h-4 mr-2" />
                Reject
            </Button>
            <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                disabled={processing}
            >
                <Check className="w-4 h-4 mr-2" />
                Approve & Merge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
