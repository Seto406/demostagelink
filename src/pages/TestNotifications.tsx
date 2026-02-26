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
        message: `This is a test notification for type: ${type}`,
        link: type === 'collab' ? '/dashboard' : '/profile'
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
        <h1 className="text-2xl font-bold mb-6">Test Notifications</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button onClick={() => handleCreateNotification('like')}>
            Trigger Like
          </Button>
          <Button onClick={() => handleCreateNotification('comment')}>
            Trigger Comment
          </Button>
          <Button onClick={() => handleCreateNotification('follow')}>
            Trigger Follow
          </Button>
          <Button onClick={() => handleCreateNotification('membership_application')}>
            Trigger Membership Application
          </Button>
          <Button onClick={() => handleCreateNotification('membership')}>
            Trigger Membership Approved
          </Button>
          <Button onClick={() => handleCreateNotification('collab')}>
            Trigger Collab Accepted
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestNotifications;
