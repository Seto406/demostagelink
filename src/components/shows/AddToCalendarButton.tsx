import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

interface AddToCalendarButtonProps {
  title: string;
  date: string | null;
  venue: string | null;
  city: string | null;
  description: string | null;
}

export const AddToCalendarButton = ({
  title,
  date,
  venue,
  city,
  description,
}: AddToCalendarButtonProps) => {
  if (!date) return null;

  const handleAddToCalendar = () => {
    const showDate = new Date(date);

    // Format for Google Calendar: YYYYMMDDTHHMMSSZ
    const formatDate = (d: Date) => {
       return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    // Assume 2 hour duration
    const startTime = formatDate(showDate);
    const endTime = formatDate(new Date(showDate.getTime() + 2 * 60 * 60 * 1000));

    const location = [venue, city].filter(Boolean).join(", ");
    const details = description || "";

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${startTime}/${endTime}&details=${encodeURIComponent(
      details
    )}&location=${encodeURIComponent(location)}`;

    window.open(googleCalendarUrl, "_blank");
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      className="gap-2 text-xs h-8 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20"
      onClick={handleAddToCalendar}
    >
      <CalendarPlus className="w-3 h-3" />
      Add to Calendar
    </Button>
  );
};
