import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutDashboard, Film, User, Plus, LogOut, Menu, X } from "lucide-react";
import stageLinkLogo from "@/assets/stagelink-logo.png";

interface Show {
  id: string;
  title: string;
  status: "PENDING APPROVAL" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "shows" | "profile">("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [shows, setShows] = useState<Show[]>([
    { id: "1", title: "Florante at Laura", status: "APPROVED", createdAt: "2024-01-15" },
    { id: "2", title: "Ibong Adarna", status: "PENDING APPROVAL", createdAt: "2024-01-20" },
  ]);

  // Form states for new show
  const [newShowTitle, setNewShowTitle] = useState("");

  // Profile form states
  const [groupName, setGroupName] = useState("RTU Drama Ensemble");
  const [description, setDescription] = useState("Rizal Technological University's premier theater group.");
  const [foundedYear, setFoundedYear] = useState("1975");
  const [niche, setNiche] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("userType");
    navigate("/");
  };

  const handleAddShow = (e: React.FormEvent) => {
    e.preventDefault();
    const newShow: Show = {
      id: Date.now().toString(),
      title: newShowTitle,
      status: "PENDING APPROVAL",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setShows([...shows, newShow]);
    setNewShowTitle("");
    setShowModal(false);
    setSuccessModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "PENDING APPROVAL":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "REJECTED":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 lg:w-20"
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-3">
              <img src={stageLinkLogo} alt="StageLink" className="h-10 w-auto" />
              {sidebarOpen && (
                <span className="text-lg font-serif font-bold text-sidebar-foreground">
                  Stage<span className="text-sidebar-accent">Link</span>
                </span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === "dashboard"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/10"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              {sidebarOpen && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => setActiveTab("shows")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === "shows"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/10"
              }`}
            >
              <Film className="w-5 h-5" />
              {sidebarOpen && <span>My Shows</span>}
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === "profile"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/10"
              }`}
            >
              <User className="w-5 h-5" />
              {sidebarOpen && <span>Profile</span>}
            </button>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <header className="border-b border-secondary/10 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="font-serif text-xl text-foreground">
            {activeTab === "dashboard" && "Dashboard"}
            {activeTab === "shows" && "My Shows"}
            {activeTab === "profile" && "Group Profile"}
          </h1>
          <div className="w-10" />
        </header>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-card border border-secondary/20 p-6">
                  <p className="text-muted-foreground text-sm mb-2">Total Shows</p>
                  <p className="text-3xl font-serif text-foreground">{shows.length}</p>
                </div>
                <div className="bg-card border border-secondary/20 p-6">
                  <p className="text-muted-foreground text-sm mb-2">Approved</p>
                  <p className="text-3xl font-serif text-green-500">
                    {shows.filter((s) => s.status === "APPROVED").length}
                  </p>
                </div>
                <div className="bg-card border border-secondary/20 p-6">
                  <p className="text-muted-foreground text-sm mb-2">Pending</p>
                  <p className="text-3xl font-serif text-yellow-500">
                    {shows.filter((s) => s.status === "PENDING APPROVAL").length}
                  </p>
                </div>
              </div>

              <div className="bg-card border border-secondary/20 p-6">
                <h2 className="font-serif text-xl text-foreground mb-4">Quick Actions</h2>
                <Button onClick={() => setShowModal(true)} variant="default">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Show
                </Button>
              </div>
            </motion.div>
          )}

          {/* Shows Tab */}
          {activeTab === "shows" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-serif text-xl text-foreground">Your Shows</h2>
                <Button onClick={() => setShowModal(true)} variant="default">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Show
                </Button>
              </div>

              <div className="bg-card border border-secondary/20 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-muted-foreground text-sm font-medium">Title</th>
                      <th className="text-left p-4 text-muted-foreground text-sm font-medium">Date Added</th>
                      <th className="text-left p-4 text-muted-foreground text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shows.map((show) => (
                      <tr key={show.id} className="border-t border-secondary/10">
                        <td className="p-4 text-foreground">{show.title}</td>
                        <td className="p-4 text-muted-foreground">{show.createdAt}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 text-xs border ${getStatusColor(show.status)}`}>
                            {show.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl space-y-6"
            >
              <div className="bg-card border border-secondary/20 p-6">
                <h2 className="font-serif text-xl text-foreground mb-6">Group Information</h2>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="bg-background border-secondary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-background border-secondary/30 min-h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="foundedYear">Founded Year</Label>
                    <Input
                      id="foundedYear"
                      value={foundedYear}
                      onChange={(e) => setFoundedYear(e.target.value)}
                      className="bg-background border-secondary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="niche">Niche</Label>
                    <Select value={niche} onValueChange={setNiche}>
                      <SelectTrigger className="bg-background border-secondary/30">
                        <SelectValue placeholder="Select your group type" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-secondary/30">
                        <SelectItem value="local">Local/Community-based</SelectItem>
                        <SelectItem value="university">University Theater Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Map Screenshot (Optional)</Label>
                    <div className="border-2 border-dashed border-secondary/30 p-8 text-center cursor-pointer hover:border-secondary/50 transition-colors">
                      <p className="text-muted-foreground text-sm">
                        Click or drag to upload your venue map
                      </p>
                    </div>
                  </div>

                  <Button type="button" variant="hero">
                    Save Profile
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Add Show Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-secondary/30">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add New Show</DialogTitle>
            <DialogDescription>
              Submit your show for review. It will be visible after admin approval.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddShow} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="showTitle">Show Title</Label>
              <Input
                id="showTitle"
                value={newShowTitle}
                onChange={(e) => setNewShowTitle(e.target.value)}
                placeholder="Enter show title"
                className="bg-background border-secondary/30"
                required
              />
            </div>
            <Button type="submit" variant="default" className="w-full">
              Submit Show
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={successModal} onOpenChange={setSuccessModal}>
        <DialogContent className="bg-card border-secondary/30 text-center">
          <div className="py-6">
            <div className="text-5xl mb-6">🎭</div>
            <DialogTitle className="font-serif text-2xl mb-4">
              Thank You! Your Submission Is Under Review
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              We've received your entry, and it is now awaiting approval from our admin team. 
              You'll be notified once your show has been reviewed.
            </DialogDescription>
            <Button onClick={() => setSuccessModal(false)} variant="outline" className="mt-6">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
