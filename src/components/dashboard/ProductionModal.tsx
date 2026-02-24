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
import { Image, Trash2, HelpCircle, Plus, Ticket, Calendar as CalendarIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { venues } from "@/data/venues";
import { Json } from "@/integrations/supabase/types";
import { calculateReservationFee } from "@/lib/pricing";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format } from "date-fns";

interface ProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface CastMember {
  name: string;
  role: string;
}

const METRO_MANILA_CITIES = [
  "Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", "Malabon",
  "Mandaluyong", "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay",
  "Pasig", "San Juan", "Taguig", "Valenzuela", "Pateros"
].sort();

const DAYS_OF_WEEK = [
  { label: "M", value: "Mondays" },
  { label: "T", value: "Tuesdays" },
  { label: "W", value: "Wednesdays" },
  { label: "Th", value: "Thursdays" },
  { label: "F", value: "Fridays" },
  { label: "S", value: "Saturdays" },
  { label: "Su", value: "Sundays" },
];

export function ProductionModal({ open, onOpenChange, showToEdit, onSuccess }: ProductionModalProps & { showToEdit?: any }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Basic Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Schedule State
  const [scheduleType, setScheduleType] = useState<"single" | "multi">("single");
  const [date, setDate] = useState(""); // For single date
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState<"local" | "university">("local");
  const [ticketLink, setTicketLink] = useState("");
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

  useEffect(() => {
    if (showToEdit) {
      setTitle(showToEdit.title || "");
      setDescription(showToEdit.description || "");

      // Parse Date
      const dateStr = showToEdit.date || "";
      if (showToEdit.seo_metadata?.schedule) {
        setScheduleType("multi");
        setDate("");
        setStartDate(showToEdit.seo_metadata.schedule.startDate);
        setEndDate(showToEdit.seo_metadata.schedule.endDate);
        setSelectedDays(showToEdit.seo_metadata.schedule.selectedDays);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        setScheduleType("single");
        setDate(dateStr);
        setStartDate("");
        setEndDate("");
        setSelectedDays([]);
      } else {
        setScheduleType("multi");
        setDate("");

        // Try parsing unstructured date
        const match = dateStr.match(/^(.*), ([A-Za-z]{3} \d{1,2}) - ([A-Za-z]{3} \d{1,2})$/);
        if (match) {
          const daysStr = match[1];
          const startStr = match[2];
          const endStr = match[3];
          const currentYear = new Date().getFullYear();
          const parseDate = (str: string) => {
            const d = new Date(`${str} ${currentYear}`);
            return !isNaN(d.getTime()) ? format(d, "yyyy-MM-dd") : "";
          };

          setStartDate(parseDate(startStr));
          setEndDate(parseDate(endStr));
          setSelectedDays(daysStr.split(" & ").map((d: string) => d.trim()));
        } else {
          // Reset multi fields as parsing back from string is not reliable without structured data
          setStartDate("");
          setEndDate("");
          setSelectedDays([]);
        }
      }

      setVenue(showToEdit.venue || "");
      setCity(showToEdit.city || "");
      setNiche(showToEdit.niche || "local");
      setTicketLink(showToEdit.ticket_link || "");
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
    setScheduleType("single");
    setDate("");
    setStartDate("");
    setEndDate("");
    setSelectedDays([]);
    setVenue("");
    setCity("");
    setNiche("local");
    setTicketLink("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    const errors: string[] = [];
    if (!title) errors.push("Title");

    // Validate Date based on schedule type
    if (scheduleType === "single" && !date) errors.push("Show Date");
    if (scheduleType === "multi") {
      if (!startDate) errors.push("Start Date");
      if (!endDate) errors.push("End Date");
      if (selectedDays.length === 0) errors.push("Show Days");
    }

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

    // Construct Date String
    let dateString: string | null = null;
    if (scheduleType === "single") {
      dateString = date;
    } else {
      const start = format(new Date(startDate), "MMM d");
      const end = format(new Date(endDate), "MMM d");

      // Sort selected days according to DAYS_OF_WEEK order
      const sortedDays = DAYS_OF_WEEK
        .filter(d => selectedDays.includes(d.value))
        .map(d => d.value);

      const daysStr = sortedDays.join(" & ");
      dateString = `${daysStr}, ${start} - ${end}`;
    }

    const payload = {
      title,
      description: description || null,
      date: dateString,
      venue: venue || null,
      city: city || null,
      niche,
      ticket_link: ticketLink || null,
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
        schedule: scheduleType === "multi" ? { startDate, endDate, selectedDays } : null,
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
                   <CalendarIcon className="w-4 h-4" /> Location & Schedule
                </p>
                <ToggleGroup type="single" value={scheduleType} onValueChange={(val) => val && setScheduleType(val as "single" | "multi")}>
                   <ToggleGroupItem value="single" size="sm" aria-label="Single Date" className="h-7 text-xs">Single Date</ToggleGroupItem>
                   <ToggleGroupItem value="multi" size="sm" aria-label="Multi-Date" className="h-7 text-xs">Schedule</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {scheduleType === "single" ? (
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
                        <SelectContent className="bg-popover border-secondary/30 max-h-60">
                          {METRO_MANILA_CITIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                 </div>
              ) : (
                 <div className="space-y-4">
                     <div className="space-y-2">
                       <Label>Show Days <span className="text-destructive">*</span></Label>
                       <ToggleGroup type="multiple" value={selectedDays} onValueChange={setSelectedDays} className="justify-start flex-wrap gap-2">
                          {DAYS_OF_WEEK.map(day => (
                             <ToggleGroupItem key={day.value} value={day.value} className="w-8 h-8 p-0 rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground" aria-label={day.value}>
                                {day.label}
                             </ToggleGroupItem>
                          ))}
                       </ToggleGroup>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Start Date <span className="text-destructive">*</span></Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-background border-secondary/30"
                                required
                            />
                         </div>
                         <div className="space-y-2">
                            <Label>End Date <span className="text-destructive">*</span></Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-background border-secondary/30"
                                required
                            />
                         </div>
                     </div>
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
                 </div>
              )}

              <div className="space-y-2 mt-4">
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
