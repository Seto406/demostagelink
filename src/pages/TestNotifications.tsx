import { Button } from "@/components/ui/button";
import { createNotification } from "@/lib/notifications";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { toast } from "sonner";

const TestNotifications = () => {
  const { user, profile } = useAuth();

  const handleCreateNotification = async (type: string) => {
    if (!profile) return;

    try {
      await createNotification({
        userId: profile.id, // Send to self
        actorId: profile.id, // From self
        type,
        title: `Test Notification: ${type}`,
        message: `This is a test notification for type: ${type}. It should have a specific icon.`,
        link: type.includes('show') ? '/shows' : type.includes('payment') ? '/profile?tab=passes' : '/dashboard'
      });
      toast.success(`Created ${type} notification`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to create ${type} notification`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24">
        <h1 className="text-2xl font-bold mb-6">Test Notifications (Deep Dive)</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-full mb-4">
             <h3 className="text-lg font-semibold mb-2">Social & Engagement</h3>
             <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleCreateNotification('like')}>Like</Button>
                <Button onClick={() => handleCreateNotification('comment')}>Comment</Button>
                <Button onClick={() => handleCreateNotification('follow')}>Follow</Button>
                <Button onClick={() => handleCreateNotification('review')}>New Review</Button>
             </div>
          </div>

          <div className="col-span-full mb-4">
             <h3 className="text-lg font-semibold mb-2">Membership & Collab</h3>
             <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleCreateNotification('membership_application')}>Membership App</Button>
                <Button onClick={() => handleCreateNotification('membership')}>Membership Approved</Button>
                <Button onClick={() => handleCreateNotification('collab')}>Collab Accepted</Button>
             </div>
          </div>

          <div className="col-span-full mb-4">
             <h3 className="text-lg font-semibold mb-2">Workflow & Transactional</h3>
             <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => handleCreateNotification('show_approved')}>Show Approved</Button>
                <Button variant="secondary" onClick={() => handleCreateNotification('show_rejected')}>Show Rejected</Button>
                <Button variant="secondary" onClick={() => handleCreateNotification('payment_approved')}>Payment Approved</Button>
                <Button variant="secondary" onClick={() => handleCreateNotification('payment_rejected')}>Payment Rejected</Button>
                <Button variant="secondary" onClick={() => handleCreateNotification('payment_submitted')}>Payment Submitted</Button>
                <Button variant="outline" onClick={() => handleCreateNotification('ticket_verified')}>Ticket Verified</Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNotifications;
