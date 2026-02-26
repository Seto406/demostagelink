
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";

const TestEmail = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"audience" | "producer">("audience");
  const [loading, setLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSendWelcome = async () => {
    if (!email) return;
    setLoading(true);
    setResult("Sending Welcome Email...");
    try {
      const { data, error } = await supabase.functions.invoke("send-welcome-email", {
        body: { email, name, role },
      });

      if (error) {
        throw new Error(error.message || "Function invocation failed");
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      console.error("Error sending welcome email:", err);
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      setResult("Error: " + message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!user) {
      setResult("Please login to test notification email (requires recipient_id)");
      return;
    }
    setNotificationLoading(true);
    setResult("Sending Notification to self...");
    try {
      const { data, error } = await supabase.functions.invoke("send-notification-email", {
        body: {
          recipient_id: user.id,
          type: "membership_application",
          data: {
            applicant_name: "Test User",
            group_name: "Your Test Group",
            link: window.location.origin + "/dashboard"
          }
        },
      });

      if (error) {
        throw new Error(error.message || "Function invocation failed");
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      console.error("Error sending notification:", err);
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      setResult("Error: " + message);
    } finally {
      setNotificationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Email Function Tester</h1>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Send Welcome Email</CardTitle>
              <CardDescription>
                Tests the 'send-welcome-email' edge function. Does not require authentication, but requires a valid email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v: "audience" | "producer") => setRole(v)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audience">Audience</SelectItem>
                    <SelectItem value="producer">Producer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSendWelcome} disabled={loading || !email} className="w-full">
                {loading ? "Sending..." : "Send Welcome Email"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Notification Email (To Self)</CardTitle>
              <CardDescription>
                Tests the 'send-notification-email' edge function. Requires you to be logged in.
                It sends a "Membership Application" notification to your account's email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
                  You must be logged in to test this function.
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-md text-sm">
                  Ready to send to: <strong>{user.email}</strong> (User ID: {user.id})
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSendNotification}
                disabled={notificationLoading || !user}
                variant="secondary"
                className="w-full"
              >
                {notificationLoading ? "Sending..." : "Send Notification to Me"}
              </Button>
            </CardFooter>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md overflow-x-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                    {result}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestEmail;
