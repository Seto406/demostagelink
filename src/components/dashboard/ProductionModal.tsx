import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreatableSelect } from "@/components/ui/creatable-select";
import { TagInput } from "@/components/ui/tag-input";
import { ImageCropper } from "@/components/ui/image-cropper";
import { toast } from "@/hooks/use-toast";
import { Image, Trash2, HelpCircle, Plus, Ticket } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { venues } from "@/data/venues";
import { Json } from "@/integrations/supabase/types";
import { calculateReservationFee } from "@/lib/pricing";

interface ProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CastMember {
  name: string;
  role: string;
}

export function ProductionModal({ open, onOpenChange, showToEdit }: ProductionModalProps & { showToEdit?: any }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState<"local" | "university">("local");
  const [ticketLink, setTicketLink] = useState("");
  const [price, setPrice] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [collectBalanceOnsite, setCollectBalanceOnsite] = useState(true);
  const [genre, setGenre] = useState<string[]>([]);
  const [director, setDirector] = useState("");
  const [duration, setDuration] = useState("");
  const [tags, setTags] = useState("");
  const [cast, setCast] = useState<CastMember[]>([]);
  const [productionStatus, setProductionStatus] = useState<"ongoing" | "completed" | "draft">("ongoing");

  const [tempCastName, setTempCastName] = useState("");
  const [tempCastRole, setTempCastRole] = useState("");

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [tempPosterSrc, setTempPosterSrc] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (showToEdit) {
      setTitle(showToEdit.title || "");
      setDescription(showToEdit.description || "");
      setDate(showToEdit.date || "");
      setVenue(showToEdit.venue || "");
      setCity(showToEdit.city || "");
      setNiche(showToEdit.niche || "local");
      setTicketLink(showToEdit.ticket_link || "");
      setPrice(showToEdit.price ? String(showToEdit.price) : "");
      setProductionStatus(showToEdit.production_status || "ongoing");
      setPosterPreview(showToEdit.poster_url || null);
    } else {
      resetForm();
    }
  }, [showToEdit, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setVenue("");
    setCity("");
    setNiche("local");
    setTicketLink("");
    setPrice("");
    setPaymentInstructions("");
    setCollectBalanceOnsite(true);
    setGenre([]);
    setDirector("");
    setDuration("");
    setTags("");
    setCast([]);
    setTempCastName("");
    setTempCastRole("");
    setProductionStatus("ongoing");
    setPosterFile(null);
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPosterPreview(null);
  };

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
      setCast([...cast, { name: tempCastName.trim(), role: tempCastRole.trim() }]);
      setTempCastName("");
      setTempCastRole("");
    }
  };

  const handleRemoveCastMember = (index: number) => {
    setCast(cast.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    const errors: string[] = [];
    if (!title) errors.push("Title");
    if (!date) errors.push("Show Date");
    if (!venue) errors.push("Venue");
    if (!city) errors.push("City");
    if (!niche) errors.push("Type (Niche)");

    if (errors.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    let posterUrl: string | null = null;

    try {
      // Get the producer's theater group ID
      const { data: theaterGroup, error: groupError } = await supabase
        .from("theater_groups" as any)
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (posterFile) {
        const fileExt = posterFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("show-posters")
          .upload(fileName, posterFile);

        if (uploadError) throw new Error(`Failed to upload poster: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from("show-posters")
          .getPublicUrl(fileName);

        posterUrl = publicUrl;
      }

    const payload = {
      title,
      description: description || null,
      date: date || null,
      venue: venue || null,
      city: city || null,
      niche,
      ticket_link: ticketLink || null,
      price: price ? parseFloat(price) : null,
      production_status: productionStatus,
      poster_url: posterUrl || (showToEdit ? showToEdit.poster_url : null),
      reservation_fee: price ? calculateReservationFee(parseFloat(price), niche) : 0,
      collect_balance_onsite: collectBalanceOnsite,
      genre: genre.length > 0 ? genre.join(", ") : null,
      director: director || null,
      duration: duration || null,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : null,
      cast_members: cast.length > 0 ? (cast as unknown as Json) : null,
      seo_metadata: paymentInstructions ? { payment_instructions: paymentInstructions } : null,
    };

    let query;
    if (showToEdit) {
      query = supabase
        .from("shows")
        .update(payload)
        .eq("id", showToEdit.id);
    } else {
      query = supabase
        .from("shows")
        .insert({
          ...payload,
          producer_id: profile.id,
          theater_group_id: theaterGroup?.id || null,
          status: "approved",
        });
    }

    const { error } = await query;
      if (error) throw new Error(`Failed to submit show: ${error.message}`);

      // Invalidate queries to update Feed and Dashboard immediately
      await queryClient.invalidateQueries({ queryKey: ['approved-shows'] });
      await queryClient.invalidateQueries({ queryKey: ['producer-shows', profile.id] });

      toast({
        title: "Submission Successful",
        description: "Your show has been submitted for review.",
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      const message = (error as { message?: string })?.message || "Failed to submit show.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => {
        if (!val && !showToEdit) resetForm();
        onOpenChange(val);
      }}>
        <DialogContent className="bg-card border-secondary/30 max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            {showToEdit ? <DialogTitle className="font-serif text-xl">Edit Production</DialogTitle> : <DialogTitle className="font-serif text-xl">Post New Production</DialogTitle>}
            <DialogDescription>
              Submit your show details. It will appear on the feed after approval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Show Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter show title"
                className="bg-background border-secondary/30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your show..."
                className="bg-background border-secondary/30"
              />
            </div>

            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-secondary/20">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Location & Schedule</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-background border-secondary/30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="bg-background border-secondary/30">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-secondary/30">
                      <SelectItem value="Mandaluyong">Mandaluyong</SelectItem>
                      <SelectItem value="Taguig">Taguig</SelectItem>
                      <SelectItem value="Manila">Manila</SelectItem>
                      <SelectItem value="Quezon City">Quezon City</SelectItem>
                      <SelectItem value="Makati">Makati</SelectItem>
                      {/* Add more cities if needed */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue <span className="text-destructive">*</span></Label>
              <CreatableSelect
                  options={venues}
                  value={venue}
                  onChange={setVenue}
                placeholder="Select or type venue"
                  className="bg-background border-secondary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentInstructions">Payment Instructions</Label>
              <Textarea
                id="paymentInstructions"
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="Instructions for paying the balance (e.g., 'Bring exact change', 'GCash QR at venue')"
                className="bg-background border-secondary/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Type</Label>
                <Select value={niche} onValueChange={(val) => setNiche(val as "local" | "university")}>
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
                  <Label htmlFor="productionStatus">Status</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Set to 'Completed' for past shows.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={productionStatus} onValueChange={(val) => setProductionStatus(val as "ongoing" | "completed" | "draft")}>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="price">Ticket Price (PHP)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Enter the amount you want to receive (Door Balance).</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="bg-background border-secondary/30"
                />
                {price && parseFloat(price) > 0 && (
                   <div className="text-xs text-muted-foreground mt-1 space-y-1">
                     <div className="flex justify-between">
                       <span>Online Reservation Fee:</span>
                       <span className="font-medium">₱{calculateReservationFee(parseFloat(price), niche).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Total Audience Price:</span>
                       <span className="font-medium">₱{(parseFloat(price) + calculateReservationFee(parseFloat(price), niche)).toFixed(2)}</span>
                     </div>
                   </div>
                )}
                {price && parseFloat(price) === 0 && (
                   <div className="text-xs text-[#3b82f6] mt-1 font-medium flex items-center gap-1">
                     <Ticket className="w-3 h-3" />
                     Free Ticket
                   </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticketLink">Ticket Link (Optional)</Label>
                <Input
                  id="ticketLink"
                  type="url"
                  value={ticketLink}
                  onChange={(e) => setTicketLink(e.target.value)}
                  placeholder="https://..."
                  className="bg-background border-secondary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Genre</Label>
                <TagInput
                  tags={genre}
                  setTags={setGenre}
                  placeholder="Genre..."
                  suggestions={[
                    "Drama", "Comedy", "Musical", "Tragedy", "Opera",
                    "Ballet", "Improv", "Experimental"
                  ]}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 2 hours"
                  className="bg-background border-secondary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="director">Director</Label>
              <Input
                id="director"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder="Director name"
                className="bg-background border-secondary/30"
              />
            </div>

            <div className="space-y-4 bg-muted/10 p-4 rounded-lg border border-secondary/10">
              <div className="flex items-center justify-between">
                <Label>Cast Members</Label>
                <span className="text-xs text-muted-foreground">{cast.length} added</span>
              </div>

              <div className="space-y-3">
                {cast.map((member, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background p-2 rounded-lg border border-secondary/20">
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{member.name}</span>
                      <span className="text-muted-foreground ml-2">as {member.role}</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCastMember(index)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          aria-label={`Remove ${member.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove cast member</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}

                <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      value={tempCastName}
                      onChange={(e) => setTempCastName(e.target.value)}
                      className="h-9 text-sm"
                      placeholder="Actor Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <Input
                      value={tempCastRole}
                      onChange={(e) => setTempCastRole(e.target.value)}
                      className="h-9 text-sm"
                      placeholder="Role"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCastMember()}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={handleAddCastMember}
                        disabled={!tempCastName || !tempCastRole}
                        aria-label="Add cast member"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add cast member</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (SEO)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated tags"
                className="bg-background border-secondary/30"
              />
            </div>

            <div className="space-y-2">
              <Label>Show Poster</Label>
              {posterPreview ? (
                <div className="relative w-48 aspect-[2/3] rounded-lg overflow-hidden border border-secondary/30 bg-secondary/10">
                  <img src={posterPreview} alt="Poster" className="w-full h-full object-cover" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={clearPoster}
                        className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                        aria-label="Remove poster"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove poster</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <label className="border-2 border-dashed border-secondary/30 p-6 text-center cursor-pointer hover:border-primary/50 transition-colors block rounded-lg">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePosterSelect}
                    className="hidden"
                  />
                  <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">Upload Poster</p>
                </label>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? "Saving..." : showToEdit ? "Update Production" : "Post Production"}
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
    </>
  );
}
