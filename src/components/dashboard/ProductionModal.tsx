import { useState, useEffect } from "react";
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
import { Image, Trash2, HelpCircle, Plus, Ticket, Calendar as CalendarIcon, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { venues } from "@/data/venues";
import { Json } from "@/integrations/supabase/types";
import { calculateReservationFee } from "@/lib/pricing";
import { format } from "date-fns";
import { useSubscription } from "@/hooks/useSubscription";
import { UpsellModal } from "./UpsellModal";

interface ProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface CastMember {
  name: string;
  role: string;
}

interface ScheduleSlot {
  date: string;
  time: string;
}

const METRO_MANILA_CITIES = [
  "Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", "Malabon",
  "Mandaluyong", "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay",
  "Pasig", "San Juan", "Taguig", "Valenzuela", "Pateros"
].sort();

// Helper function to safely parse YYYY-MM-DD as local date
const parseDateLocal = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// Helper function to convert legacy range format to slots
const convertRangeToSlots = (start: string, end: string, selectedDays: string[]): ScheduleSlot[] => {
    const slots: ScheduleSlot[] = [];
    const startDate = parseDateLocal(start);
    const endDate = parseDateLocal(end);
    const dayMap: { [key: string]: number } = {
        "Sundays": 0, "Mondays": 1, "Tuesdays": 2, "Wednesdays": 3,
        "Thursdays": 4, "Fridays": 5, "Saturdays": 6
    };

    const targetDays = selectedDays.map(d => dayMap[d]).filter(d => d !== undefined);

    // Safety check to prevent infinite loops if dates are invalid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
        return [{ date: start || "", time: "" }];
    }

    // Limit the loop to avoid performance issues (e.g. max 365 days)
    let safetyCounter = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (safetyCounter++ > 365) break;
        if (targetDays.includes(d.getDay())) {
            slots.push({
                date: format(d, "yyyy-MM-dd"),
                time: ""
            });
        }
    }
    return slots.length > 0 ? slots : [{ date: start, time: "" }];
};

export function ProductionModal({ open, onOpenChange, showToEdit, onSuccess }: ProductionModalProps & { showToEdit?: any }) {
  const { user, profile } = useAuth();
  const { isPro } = useSubscription();
  const queryClient = useQueryClient();

  // Basic Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Schedule State (New List Format)
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([{ date: "", time: "" }]);

  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState<"local" | "university">("local");
  const [externalLinks, setExternalLinks] = useState<string[]>([""]);
  const [price, setPrice] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [collectBalanceOnsite, setCollectBalanceOnsite] = useState(true);
  const [genre, setGenre] = useState<string[]>([]);
  const [director, setDirector] = useState("");

  // Duration State
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");

  const [tags, setTags] = useState<string[]>([]);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [productionStatus, setProductionStatus] = useState<"ongoing" | "completed" | "draft">("ongoing");

  const [tempCastName, setTempCastName] = useState("");
  const [tempCastRole, setTempCastRole] = useState("");

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [tempPosterSrc, setTempPosterSrc] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upsell State
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [upsellContext, setUpsellContext] = useState<{ featureName?: string, description?: string }>({});

  useEffect(() => {
    if (showToEdit) {
      setTitle(showToEdit.title || "");
      setDescription(showToEdit.description || "");

      // Parse Schedule
      const scheduleData = showToEdit.seo_metadata?.schedule;

      if (Array.isArray(scheduleData)) {
          // New format: direct assignment
          setScheduleSlots(scheduleData);
      } else if (scheduleData && typeof scheduleData === 'object' && scheduleData.startDate) {
          // Legacy format: Convert range to slots
          const convertedSlots = convertRangeToSlots(
              scheduleData.startDate,
              scheduleData.endDate,
              scheduleData.selectedDays || []
          );
          setScheduleSlots(convertedSlots);
      } else {
          // Fallback to main date column
          const dateStr = showToEdit.date || "";
          // Check if dateStr looks like a single date "yyyy-MM-dd"
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
               setScheduleSlots([{ date: dateStr, time: showToEdit.show_time || "" }]);
          } else {
              // Try to parse text date or just default
              // Reset to empty if unstructured
               setScheduleSlots([{ date: "", time: showToEdit.show_time || "" }]);
          }
      }

      setVenue(showToEdit.venue || "");
      setCity(showToEdit.city || "");
      setNiche(showToEdit.niche || "local");

      // Links Logic
      if (showToEdit.external_links && Array.isArray(showToEdit.external_links) && showToEdit.external_links.length > 0) {
        setExternalLinks(showToEdit.external_links.map((l: any) => String(l)));
      } else if (showToEdit.ticket_link) {
        setExternalLinks([showToEdit.ticket_link]);
      } else {
        setExternalLinks([""]);
      }

      setPrice(showToEdit.price ? String(showToEdit.price) : "");
      setProductionStatus(showToEdit.production_status || "ongoing");
      setPosterPreview(showToEdit.poster_url || null);

      // Parse Duration
      if (showToEdit.duration) {
        const hoursMatch = showToEdit.duration.match(/(\d+)\s*Hours?/i);
        const minutesMatch = showToEdit.duration.match(/(\d+)\s*Minutes?/i);
        setHours(hoursMatch ? hoursMatch[1] : "");
        setMinutes(minutesMatch ? minutesMatch[1] : "");
      } else {
        setHours("");
        setMinutes("");
      }

      // Handle tags (array or string fallback)
      if (Array.isArray(showToEdit.tags)) {
        setTags(showToEdit.tags);
      } else if (typeof showToEdit.tags === 'string') {
        setTags(showToEdit.tags.split(',').map((t: string) => t.trim()).filter(Boolean));
      } else {
        setTags([]);
      }

      setGenre(showToEdit.genre ? showToEdit.genre.split(',').map((g: string) => g.trim()) : []);
      setDirector(showToEdit.director || "");
      setPaymentInstructions(showToEdit.seo_metadata?.payment_instructions || "");
      setCast((showToEdit.cast_members as unknown as CastMember[]) || []);

    } else {
      resetForm();
    }
  }, [showToEdit, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setScheduleSlots([{ date: "", time: "" }]);
    setVenue("");
    setCity("");
    setNiche("local");
    setExternalLinks([""]);
    setPrice("");
    setPaymentInstructions("");
    setCollectBalanceOnsite(true);
    setGenre([]);
    setDirector("");
    setHours("");
    setMinutes("");
    setTags([]);
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

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...externalLinks];
    newLinks[index] = value;
    setExternalLinks(newLinks);
  };

  const addLink = () => {
      if (!isPro && externalLinks.length >= 1) {
          setUpsellContext({
              featureName: "Multiple Links",
              description: "Adding multiple links requires a Premium subscription."
          });
          setUpsellOpen(true);
          return;
      }
      if (externalLinks.length >= 3) {
           toast({ title: "Limit Reached", description: "Maximum of 3 links allowed." });
           return;
      }
      setExternalLinks([...externalLinks, ""]);
  };

  // Schedule Handlers
  const handleSlotChange = (index: number, field: keyof ScheduleSlot, value: string) => {
      const newSlots = [...scheduleSlots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      setScheduleSlots(newSlots);
  };

  const addSlot = () => {
      setScheduleSlots([...scheduleSlots, { date: "", time: "" }]);
  };

  const removeSlot = (index: number) => {
      if (scheduleSlots.length > 1) {
          setScheduleSlots(scheduleSlots.filter((_, i) => i !== index));
      }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    const errors: string[] = [];
    if (!title) errors.push("Title");

    // Validate Schedule
    const hasValidSlot = scheduleSlots.some(s => s.date);
    if (!hasValidSlot) errors.push("At least one Show Date");

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

    if (price && parseFloat(price) < 0) {
      toast({
        title: "Invalid Price",
        description: "Price cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    let finalPosterUrl: string | null = null;

    try {
      // Get the producer's theater group ID
      const { data: theaterGroup, error: groupError } = await supabase
        .from("theater_groups" as any)
        .select("id")
        .eq("owner_id", profile.id)
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

        finalPosterUrl = publicUrl;
      } else if (showToEdit && posterPreview === showToEdit.poster_url) {
        finalPosterUrl = showToEdit.poster_url;
      }

    // Construct Duration String
    let duration: string | null = "";
    if (hours && parseInt(hours) > 0) {
      duration += `${hours} ${parseInt(hours) === 1 ? "Hour" : "Hours"}`;
    }
    if (minutes && parseInt(minutes) > 0) {
      if (duration) duration += " ";
      duration += `${minutes} ${parseInt(minutes) === 1 ? "Minute" : "Minutes"}`;
    }
    if (!duration) duration = null;

    // Filter out empty slots
    const validSlots = scheduleSlots.filter(s => s.date);

    // Sort slots by date
    validSlots.sort((a, b) => parseDateLocal(a.date).getTime() - parseDateLocal(b.date).getTime());

    // Construct Display Date String (comma separated)
    const dateStrings = validSlots.map(s => format(parseDateLocal(s.date), "MMM d"));
    // Remove duplicates for the summary
    const uniqueDates = Array.from(new Set(dateStrings));
    const displayDateString = uniqueDates.join(", ");

    // Construct Display Time String
    // If all times are the same, use that. Otherwise "Various Times"
    const uniqueTimes = Array.from(new Set(validSlots.map(s => s.time).filter(Boolean)));
    let displayTimeString = "";

    if (uniqueTimes.length === 1) {
        // Convert 24h to 12h
        const [h, m] = uniqueTimes[0].split(":");
        const d = new Date();
        d.setHours(parseInt(h));
        d.setMinutes(parseInt(m));
        displayTimeString = format(d, "h:mm a");
    } else if (uniqueTimes.length > 1) {
        displayTimeString = "Various Times";
    }

    const validLinks = externalLinks.filter(l => l.trim() !== "");

    const payload = {
      title,
      description: description || null,
      date: displayDateString,
      show_time: displayTimeString || null,
      venue: venue || null,
      city: city || null,
      niche,
      ticket_link: validLinks[0] || null,
      external_links: validLinks,
      price: price ? parseFloat(price) : null,
      production_status: productionStatus,
      poster_url: finalPosterUrl,
      reservation_fee: price ? calculateReservationFee(parseFloat(price), niche) : 0,
      collect_balance_onsite: collectBalanceOnsite,
      genre: genre.length > 0 ? genre.join(", ") : null,
      director: director || null,
      duration,
      tags: tags.length > 0 ? tags : null,
      cast_members: cast.length > 0 ? (cast as unknown as Json) : null,
      seo_metadata: {
        ...(showToEdit?.seo_metadata || {}),
        payment_instructions: paymentInstructions || null,
        schedule: validSlots, // Save the full array of slots
      },
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
      await queryClient.invalidateQueries({ queryKey: ['productions'] });
      await queryClient.invalidateQueries({ queryKey: ['shows'] });

      toast({
        title: "Submission Successful",
        description: "Your show has been submitted for review.",
      });

      if (onSuccess) {
        onSuccess();
      }

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
                maxLength={2000}
              />
              <div className="text-xs text-right text-muted-foreground">
                {description.length} / 2000
              </div>
            </div>

            {/* New Schedule System */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-secondary/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                   <CalendarIcon className="w-4 h-4" /> Schedule
                </p>
              </div>

              <div className="space-y-3">
                  {scheduleSlots.map((slot, index) => (
                      <div key={index} className="flex gap-2 items-end">
                           <div className="space-y-1 flex-1">
                               <Label className="text-xs">Date</Label>
                               <Input
                                  type="date"
                                  value={slot.date}
                                  onChange={(e) => handleSlotChange(index, 'date', e.target.value)}
                                  className="bg-background border-secondary/30"
                                  required={index === 0}
                               />
                           </div>
                           <div className="space-y-1 w-32">
                               <Label className="text-xs">Time</Label>
                               <Input
                                  type="time"
                                  value={slot.time}
                                  onChange={(e) => handleSlotChange(index, 'time', e.target.value)}
                                  className="bg-background border-secondary/30"
                               />
                           </div>
                           <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSlot(index)}
                                disabled={scheduleSlots.length === 1}
                                className="text-destructive hover:bg-destructive/10 mb-[2px]"
                           >
                               <Trash2 className="w-4 h-4" />
                           </Button>
                      </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSlot}
                    className="text-xs w-full mt-2"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add another date
                  </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-secondary/10">
                   <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger className="bg-background border-secondary/30">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-secondary/30 max-h-60">
                          {METRO_MANILA_CITIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="venue">Venue *</Label>
                        <CreatableSelect
                        options={venues}
                        value={venue}
                        onChange={setVenue}
                        placeholder="Select or type venue"
                        className="bg-background border-secondary/30"
                        />
                    </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentInstructions">Payment Instructions</Label>
              <Textarea
                id="paymentInstructions"
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="Instructions for paying the balance (e.g., 'Bring exact amount', 'or you can scan the QR Code at the venue for payment.')"
                className="bg-background border-secondary/30"
                maxLength={500}
              />
              <div className="text-xs text-right text-muted-foreground">
                {paymentInstructions.length} / 500
              </div>
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

                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    disabled={!isPro}
                    className={`bg-background border-secondary/30 ${!isPro ? "opacity-50 cursor-not-allowed pr-10" : ""}`}
                  />
                  {!isPro && (
                      <div
                          className="absolute inset-0 z-10 cursor-pointer flex items-center justify-end pr-3"
                          onClick={() => {
                              setUpsellContext({
                                   featureName: "Direct Ticketing",
                                   description: "Selling tickets directly through StageLink requires a Premium subscription."
                              });
                              setUpsellOpen(true);
                          }}
                      >
                           <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                  )}
                </div>

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
                <Label htmlFor="ticketLink">Ticket / External Links</Label>
                {externalLinks.map((link, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                        <Input
                            value={link}
                            onChange={(e) => handleLinkChange(index, e.target.value)}
                            placeholder={index === 0 ? "Main Ticket Link (https://...)" : "Additional Link (https://...)"}
                            className="bg-background border-secondary/30"
                        />
                         {index > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    const newLinks = externalLinks.filter((_, i) => i !== index);
                                    setExternalLinks(newLinks);
                                }}
                            >
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                ))}
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLink}
                    className="text-xs w-full"
                >
                    <Plus className="w-3 h-3 mr-1" /> Add another link
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Genre</Label>
                <div onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}>
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
              </div>

              {/* Refactored Duration UI */}
              <div className="space-y-2">
                <Label>Duration</Label>
                <div className="flex gap-2 items-center">
                    <div className="flex-1 space-y-1">
                         <Label className="text-xs text-muted-foreground">Hours</Label>
                         <Input
                           type="number"
                           min="0"
                           value={hours}
                           onChange={(e) => setHours(e.target.value)}
                           placeholder="0"
                           className="bg-background border-secondary/30"
                         />
                    </div>
                    <div className="flex-1 space-y-1">
                         <Label className="text-xs text-muted-foreground">Minutes</Label>
                         <Input
                           type="number"
                           min="0"
                           max="59"
                           value={minutes}
                           onChange={(e) => setMinutes(e.target.value)}
                           placeholder="0"
                           className="bg-background border-secondary/30"
                         />
                    </div>
                </div>
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

            <div className="space-y-4 bg-muted/10 p-4 rounded-lg border border-secondary/10 relative z-0">
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

            <div className="space-y-2 relative z-10">
              <Label>Tags (SEO)</Label>
              <div onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}>
                  <TagInput
                    tags={tags}
                    setTags={setTags}
                    placeholder="Add tags..."
                    className="bg-background"
                  />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Show Poster</Label>
              <p className="text-xs text-muted-foreground mb-2">Portrait orientation (2:3 aspect ratio) recommended. Max size 5MB.</p>
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
      <UpsellModal
        open={upsellOpen}
        onOpenChange={setUpsellOpen}
        featureName={upsellContext.featureName}
        description={upsellContext.description}
      />

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
