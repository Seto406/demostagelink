import { useState, useEffect } from "react";
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
import { Image, Trash2, Plus, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { TagInput } from "@/components/ui/tag-input";
import { ImageCropper } from "@/components/ui/image-cropper";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { venues } from "@/data/venues";

export interface CastMember {
  name: string;
  role: string;
}

export interface Show {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  niche: "local" | "university" | null;
  ticket_link: string | null;
  poster_url: string | null;
  status: "pending" | "approved" | "rejected" | "archived";
  production_status: "ongoing" | "completed" | "draft";
  created_at: string;
  deleted_at?: string | null;
  genre: string | null;
  director: string | null;
  duration: string | null;
  tags: string[] | null;
  cast_members: CastMember[] | null;
  price: number | null;
  is_featured?: boolean;
}

const resizeImage = (file: File, maxWidth = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error("Canvas to Blob conversion failed"));
            }
          },
          "image/jpeg",
          0.8
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

interface ProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingShow?: Show | null;
  onSuccess?: () => void;
}

export function ProductionModal({ open, onOpenChange, editingShow, onSuccess }: ProductionModalProps) {
  const { user, profile } = useAuth();

  // Form states
  const [newShowTitle, setNewShowTitle] = useState("");
  const [newShowDescription, setNewShowDescription] = useState("");
  const [newShowDate, setNewShowDate] = useState("");
  const [newShowVenue, setNewShowVenue] = useState("");
  const [newShowCity, setNewShowCity] = useState("");
  const [newShowNiche, setNewShowNiche] = useState<"local" | "university">("local");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [newShowTicketLink, setNewShowTicketLink] = useState("");
  const [newShowPrice, setNewShowPrice] = useState("");
  const [newShowGenre, setNewShowGenre] = useState<string[]>([]);
  const [newShowDirector, setNewShowDirector] = useState("");
  const [newShowDuration, setNewShowDuration] = useState("");
  const [newShowTags, setNewShowTags] = useState("");
  const [newShowCast, setNewShowCast] = useState<CastMember[]>([]);
  const [tempCastName, setTempCastName] = useState("");
  const [tempCastRole, setTempCastRole] = useState("");
  const [newShowProductionStatus, setNewShowProductionStatus] = useState<"ongoing" | "completed" | "draft">("ongoing");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempPosterSrc, setTempPosterSrc] = useState<string | null>(null);

  const [successModal, setSuccessModal] = useState(false);

  const resetForm = () => {
    setNewShowTitle("");
    setNewShowDescription("");
    setNewShowDate("");
    setNewShowVenue("");
    setNewShowCity("");
    setNewShowNiche("local");
    setNewShowTicketLink("");
    setNewShowPrice("");
    setNewShowGenre([]);
    setNewShowDirector("");
    setNewShowDuration("");
    setNewShowTags("");
    setNewShowCast([]);
    setTempCastName("");
    setTempCastRole("");
    setNewShowProductionStatus("ongoing");
    setPosterFile(null);
    if (posterPreview && !editingShow) {
      URL.revokeObjectURL(posterPreview);
      setPosterPreview(null);
    } else if (editingShow) {
        setPosterPreview(editingShow.poster_url);
    } else {
        setPosterPreview(null);
    }
  };

  useEffect(() => {
    if (open) {
      if (editingShow) {
        setNewShowTitle(editingShow.title);
        setNewShowDescription(editingShow.description || "");
        setNewShowDate(editingShow.date || "");
        setNewShowVenue(editingShow.venue || "");
        setNewShowCity(editingShow.city || "");
        setNewShowNiche(editingShow.niche || "local");
        setNewShowTicketLink(editingShow.ticket_link || "");
        setNewShowPrice(editingShow.price?.toString() || "");
        setNewShowGenre(editingShow.genre ? editingShow.genre.split(",").map(g => g.trim()) : []);
        setNewShowDirector(editingShow.director || "");
        setNewShowDuration(editingShow.duration || "");
        setNewShowTags(editingShow.tags?.join(", ") || "");

        const castData = editingShow.cast_members && Array.isArray(editingShow.cast_members)
          ? (editingShow.cast_members as unknown as CastMember[])
          : [];
        setNewShowCast(castData);

        setNewShowProductionStatus(editingShow.production_status || "ongoing");
        setPosterPreview(editingShow.poster_url);
        setPosterFile(null);
      } else {
        resetForm();
      }
    }
  }, [open, editingShow]);

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setTempPosterSrc(reader.result?.toString() || "");
      setCropperOpen(true);
    });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], "poster.jpg", { type: "image/jpeg" });
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(croppedBlob));
    setCropperOpen(false);
    setTempPosterSrc(null);
  };

  const clearPoster = () => {
    setPosterFile(null);
    if (posterPreview) {
      URL.revokeObjectURL(posterPreview);
      setPosterPreview(null);
    }
  };

  const handleAddCastMember = () => {
    if (tempCastName.trim() && tempCastRole.trim()) {
      setNewShowCast([...newShowCast, { name: tempCastName.trim(), role: tempCastRole.trim() }]);
      setTempCastName("");
      setTempCastRole("");
    }
  };

  const handleRemoveCastMember = (index: number) => {
    setNewShowCast(newShowCast.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    // Validation
    const errors: string[] = [];
    if (!newShowTitle) errors.push("Title");
    if (!newShowDate) errors.push("Show Date");
    if (!newShowVenue) errors.push("Venue");
    if (!newShowCity) errors.push("City");
    if (!newShowNiche) errors.push("Type (Niche)");

    if (errors.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setUploadingPoster(true);
    let posterUrl: string | null = editingShow ? editingShow.poster_url : null;

    try {
      if (posterFile) {
        const fileExt = posterFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("show-posters")
          .upload(fileName, posterFile);

        if (uploadError) {
          throw new Error(`Failed to upload poster: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from("show-posters")
          .getPublicUrl(fileName);

        posterUrl = publicUrl;
      }

      if (editingShow) {
        // Update
        const { error } = await supabase
          .from("shows")
          .update({
            title: newShowTitle,
            description: newShowDescription || null,
            date: newShowDate || null,
            venue: newShowVenue || null,
            city: newShowCity || null,
            niche: newShowNiche,
            poster_url: posterUrl,
            production_status: newShowProductionStatus,
            ticket_link: newShowTicketLink || null,
            price: newShowPrice ? parseFloat(newShowPrice) : 0,
            genre: newShowGenre.length > 0 ? newShowGenre.join(", ") : null,
            director: newShowDirector || null,
            duration: newShowDuration || null,
            tags: newShowTags ? newShowTags.split(",").map(t => t.trim()).filter(Boolean) : null,
            cast_members: newShowCast.length > 0 ? (newShowCast as unknown as Json) : null,
          })
          .eq("id", editingShow.id);

        if (error) throw new Error(`Failed to update show: ${error.message}`);

        toast({
            title: "Success",
            description: "Show updated successfully!",
        });
      } else {
        // Create
        const { error } = await supabase
          .from("shows")
          .insert({
            producer_id: profile.id,
            title: newShowTitle,
            description: newShowDescription || null,
            date: newShowDate || null,
            venue: newShowVenue || null,
            city: newShowCity || null,
            niche: newShowNiche,
            status: "pending",
            production_status: newShowProductionStatus,
            poster_url: posterUrl,
            ticket_link: newShowTicketLink || null,
            price: newShowPrice ? parseFloat(newShowPrice) : 0,
            genre: newShowGenre.length > 0 ? newShowGenre.join(", ") : null,
            director: newShowDirector || null,
            duration: newShowDuration || null,
            tags: newShowTags ? newShowTags.split(",").map(t => t.trim()).filter(Boolean) : null,
            cast_members: newShowCast.length > 0 ? (newShowCast as unknown as Json) : null,
          });

        if (error) throw new Error(`Failed to submit show: ${error.message}`);

        // Only show success modal for new shows
        setSuccessModal(true);
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();

    } catch (error) {
      const message = (error as { message?: string })?.message || "Failed to submit show. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploadingPoster(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-secondary/30 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingShow ? "Edit Show" : "Add New Show"}
            </DialogTitle>
            <DialogDescription>
              {editingShow
                ? "Update your show details. Changes will be saved immediately."
                : "Submit your show for review. It will be visible after admin approval."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="showTitle">Show Title *</Label>
              <Input
                id="showTitle"
                value={newShowTitle}
                onChange={(e) => setNewShowTitle(e.target.value)}
                placeholder="Enter show title"
                className="bg-background border-secondary/30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="showDescription">Description</Label>
              <Textarea
                id="showDescription"
                value={newShowDescription}
                onChange={(e) => setNewShowDescription(e.target.value)}
                placeholder="Describe your show"
                className="bg-background border-secondary/30"
              />
            </div>

            {/* Location & Schedule Section */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-secondary/20">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Location & Schedule</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="showDate">Show Date <span className="text-destructive">*</span></Label>
                  <Input
                    id="showDate"
                    type="date"
                    value={newShowDate}
                    onChange={(e) => setNewShowDate(e.target.value)}
                    className="bg-background border-secondary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="showCity">City</Label>
                  <Select value={newShowCity} onValueChange={setNewShowCity}>
                    <SelectTrigger className="bg-background border-secondary/30">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-secondary/30">
                      <SelectItem value="Mandaluyong">Mandaluyong</SelectItem>
                      <SelectItem value="Taguig">Taguig</SelectItem>
                      <SelectItem value="Manila">Manila</SelectItem>
                      <SelectItem value="Quezon City">Quezon City</SelectItem>
                      <SelectItem value="Makati">Makati</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="showVenue">Venue <span className="text-destructive">*</span></Label>
                <SearchableSelect
                  options={venues}
                  value={newShowVenue}
                  onChange={setNewShowVenue}
                  placeholder="Select venue"
                  className="bg-background border-secondary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="showNiche">Type</Label>
                <Select value={newShowNiche} onValueChange={(val) => setNewShowNiche(val as "local" | "university")}>
                  <SelectTrigger className="bg-background border-secondary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-secondary/30">
                    <SelectItem value="local">Local/Community</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="showProductionStatus">Production Status</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Adding past productions helps build trust with new audience members and acts as a digital portfolio.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={newShowProductionStatus} onValueChange={(val) => setNewShowProductionStatus(val as "ongoing" | "completed" | "draft")}>
                  <SelectTrigger className="bg-background border-secondary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-secondary/30">
                    <SelectItem value="ongoing">Ongoing/Upcoming</SelectItem>
                    <SelectItem value="completed">Completed (Past)</SelectItem>
                    <SelectItem value="draft">Draft (Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="showPrice">Ticket Price (PHP)</Label>
                <Input
                  id="showPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newShowPrice}
                  onChange={(e) => setNewShowPrice(e.target.value)}
                  placeholder="0.00"
                  className="bg-background border-secondary/30"
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 for free shows or external ticketing.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="showTicketLink">External Ticket Link</Label>
                <Input
                  id="showTicketLink"
                  type="url"
                  value={newShowTicketLink}
                  onChange={(e) => setNewShowTicketLink(e.target.value)}
                  placeholder="https://tickets.example.com"
                  className="bg-background border-secondary/30"
                />
                <p className="text-xs text-muted-foreground">
                  Optional override
                </p>
              </div>
            </div>

            {/* New Fields: Genre, Director, Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="showGenre">Genre</Label>
                <TagInput
                  id="showGenre"
                  tags={newShowGenre}
                  setTags={setNewShowGenre}
                  placeholder="Type genre and press Enter..."
                  suggestions={[
                    "Drama", "Comedy", "Musical", "Tragedy", "Opera",
                    "Ballet", "Improv", "Experimental", "Children's Theatre",
                    "Pantomime", "Farce", "Satire", "Historical"
                  ]}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="showDuration">Duration</Label>
                <Input
                  id="showDuration"
                  value={newShowDuration}
                  onChange={(e) => setNewShowDuration(e.target.value)}
                  placeholder="e.g., 2 hours"
                  className="bg-background border-secondary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="showDirector">Director</Label>
              <Input
                id="showDirector"
                value={newShowDirector}
                onChange={(e) => setNewShowDirector(e.target.value)}
                placeholder="Director name"
                className="bg-background border-secondary/30"
              />
            </div>

            <div className="space-y-4 bg-muted/10 p-4 rounded-lg border border-secondary/10">
              <div className="flex items-center justify-between">
                <Label>Cast Members</Label>
                <span className="text-xs text-muted-foreground">{newShowCast.length} added</span>
              </div>

              <div className="space-y-3">
                {/* List of added members */}
                {newShowCast.map((member, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background p-2 rounded-lg border border-secondary/20">
                    <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium text-foreground truncate" title={member.name}>{member.name}</div>
                      <div className="text-muted-foreground border-l border-secondary/20 pl-2 truncate" title={member.role}>{member.role}</div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCastMember(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Input fields for new member */}
                <div className="grid grid-cols-[1fr,1fr,auto] items-end gap-2 pt-2 border-t border-secondary/10">
                  <div className="space-y-1">
                    <Label htmlFor="castName" className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      id="castName"
                      value={tempCastName}
                      onChange={(e) => setTempCastName(e.target.value)}
                      placeholder="Actor Name"
                      className="bg-background border-secondary/30 h-9 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('castRole')?.focus();
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="castRole" className="text-xs text-muted-foreground">Role</Label>
                    <Input
                      id="castRole"
                      value={tempCastRole}
                      onChange={(e) => setTempCastRole(e.target.value)}
                      placeholder="Role"
                      className="bg-background border-secondary/30 h-9 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCastMember();
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddCastMember}
                    variant="secondary"
                    size="sm"
                    className="h-9 w-9 p-0"
                    disabled={!tempCastName.trim() || !tempCastRole.trim()}
                    title="Add Cast Member"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="showTags">Tags (SEO)</Label>
              <Input
                id="showTags"
                value={newShowTags}
                onChange={(e) => setNewShowTags(e.target.value)}
                placeholder="Comma-separated tags (e.g., Filipino, Original, Award-winning)"
                className="bg-background border-secondary/30"
              />
              <p className="text-xs text-muted-foreground">
                Tags help users find your show
              </p>
            </div>

            <div className="space-y-2">
              <Label>Show Poster</Label>
              {posterPreview ? (
                <div className="relative w-48 aspect-[2/3] rounded-lg overflow-hidden border border-secondary/30 bg-secondary/10">
                  <img
                    src={posterPreview}
                    alt="Poster preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearPoster}
                    className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                    aria-label="Remove poster"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-secondary/30 p-6 text-center cursor-pointer hover:border-primary/50 transition-colors block">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePosterSelect}
                    className="hidden"
                  />
                  <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    Click to upload poster
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    JPG, PNG or WebP (max 5MB)
                  </p>
                </label>
              )}
            </div>

            <Button type="submit" variant="default" className="w-full" disabled={uploadingPoster}>
              {uploadingPoster ? "Saving..." : (editingShow ? "Save Changes" : "Submit Show")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {tempPosterSrc && (
        <ImageCropper
          imageSrc={tempPosterSrc}
          open={cropperOpen}
          onCropComplete={onCropComplete}
          onCancel={() => {
            setCropperOpen(false);
            setTempPosterSrc(null);
          }}
          aspect={2 / 3}
        />
      )}

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
    </>
  );
}
