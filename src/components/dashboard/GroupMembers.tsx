import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Users, Upload, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/ui/ripple-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface GroupMember {
  id: string;
  member_name: string;
  role_in_group: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface GroupMembersProps {
  profileId: string;
  isPro?: boolean;
  onUpsell?: () => void;
}

export const GroupMembers = ({ profileId, isPro = false, onUpsell }: GroupMembersProps) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Form states
  const [memberName, setMemberName] = useState("");
  const [roleInGroup, setRoleInGroup] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!isPro) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", profileId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching members:", error);
    } else {
      setMembers(data as GroupMember[]);
    }
    setLoading(false);
  }, [profileId, isPro]);

  useEffect(() => {
    if (profileId) {
      fetchMembers();
    }
  }, [profileId, fetchMembers]);

  const resetForm = () => {
    setMemberName("");
    setRoleInGroup("");
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditingMember(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (member: GroupMember) => {
    setEditingMember(member);
    setMemberName(member.member_name);
    setRoleInGroup(member.role_in_group || "");
    setAvatarPreview(member.avatar_url);
    setShowModal(true);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prefer session profile ID for security/correctness when adding members to own group.
    // Note: fetchMembers uses profileId prop to allow viewing, but adding is scoped to session.
    const effectiveProfileId = profile?.id || profileId;

    if (!effectiveProfileId) {
      console.error("Missing profileId in GroupMembers");
      toast({
        title: "Error",
        description: "Missing profile information. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!memberName.trim()) {
      toast({
        title: "Error",
        description: "Member name is required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    let avatarUrl: string | null = editingMember?.avatar_url || null;

    try {
      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${effectiveProfileId}/members/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile);

        if (uploadError) {
          throw new Error("Failed to upload avatar");
        }

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        
        avatarUrl = publicUrl;
      }

      if (editingMember) {
        // Update existing member
        const { error } = await supabase
          .from("group_members")
          .update({
            member_name: memberName.trim(),
            role_in_group: roleInGroup.trim() || null,
            avatar_url: avatarUrl,
          })
          .eq("id", editingMember.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Member updated successfully!",
        });
      } else {
        // Add new member
        try {
          console.log("Adding member for group:", effectiveProfileId);
          const { error } = await supabase
            .from("group_members")
            .insert({
              group_id: effectiveProfileId,
              member_name: memberName.trim(),
              role_in_group: roleInGroup.trim() || null,
              avatar_url: avatarUrl,
            });

          if (error) throw error;

          toast({
            title: "Success",
            description: "Member added successfully!",
          });
        } catch (insertError: any) {
          console.error("Error adding member:", insertError);
          throw insertError;
        }
      }

      resetForm();
      setShowModal(false);
      fetchMembers();
    } catch (error: any) {
      console.error("Save member error:", error);
      toast({
        title: "Error",
        description: error.message || (error instanceof Error ? error.message : "Failed to save member."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed successfully.",
      });
      fetchMembers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member.",
        variant: "destructive",
      });
    }
    setDeleteConfirm(null);
  };

  if (!isPro) {
    return (
      <div className="bg-card border border-secondary/20 p-6 ios-rounded relative overflow-hidden">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-secondary/10 p-4 rounded-full mb-4">
            <Lock className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="font-serif text-2xl font-bold mb-2">Cast & Crew Management Locked</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Showcase your talented team! Upgrade to Pro to add cast and crew members to your group profile.
          </p>
          <Button onClick={() => onUpsell ? onUpsell() : navigate("/settings")} variant="default" size="lg">
            Upgrade to Pro
          </Button>
        </div>

        {/* Placeholder Content */}
        <div className="flex items-center justify-between mb-6 opacity-20 filter blur-sm select-none pointer-events-none">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-xl text-foreground">Group Members</h2>
          </div>
          <RippleButton variant="ios" size="sm" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </RippleButton>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-20 filter blur-sm select-none pointer-events-none">
             <div className="h-24 bg-secondary/20 rounded-xl"></div>
             <div className="h-24 bg-secondary/20 rounded-xl"></div>
             <div className="h-24 bg-secondary/20 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-secondary/20 p-6 ios-rounded">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Group Members</h2>
        </div>
        <RippleButton onClick={openAddModal} variant="ios" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </RippleButton>
      </div>

      <p className="text-muted-foreground text-sm mb-6">
        Add your theater group's cast and crew members to showcase your team.
      </p>

      {loading ? (
        <div className="text-muted-foreground text-center py-8">Loading members...</div>
      ) : members.length === 0 ? (
        <div className="border border-dashed border-secondary/30 p-8 text-center ios-rounded">
          <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-4">Collaborators will appear here once invited.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-background border border-secondary/20 p-4 ios-rounded flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.member_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-serif text-muted-foreground">
                    {member.member_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{member.member_name}</p>
                {member.role_in_group && (
                  <p className="text-sm text-muted-foreground truncate">{member.role_in_group}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(member)}
                  className="h-8 w-8 p-0"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(member.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Member Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-secondary/30">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingMember ? "Edit Member" : "Add New Member"}
            </DialogTitle>
            <DialogDescription>
              {editingMember 
                ? "Update member information."
                : "Add a new member to your theater group."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMember} className="space-y-4 mt-4">
            {/* Avatar Upload */}
            <div className="flex justify-center">
              <label className="relative cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-secondary/30 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors">
                  {avatarPreview ? (
                    <>
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        }}
                        className="absolute top-0 right-0 p-1 bg-destructive text-destructive-foreground rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Photo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberName">Name *</Label>
              <Input
                id="memberName"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Enter member name"
                className="bg-background border-secondary/30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleInGroup">Role / Position</Label>
              <Input
                id="roleInGroup"
                value={roleInGroup}
                onChange={(e) => setRoleInGroup(e.target.value)}
                placeholder="e.g., Director, Actor, Stage Manager"
                className="bg-background border-secondary/30"
              />
            </div>

            <Button type="submit" variant="default" className="w-full" disabled={saving}>
              {saving ? "Saving..." : (editingMember ? "Save Changes" : "Add Member")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-secondary/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the member from your group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteMember(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
