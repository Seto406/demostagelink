import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export type EventType = 'ticket_click' | 'profile_view';

export const trackEvent = async (
  eventType: EventType,
  groupId: string,
  showId?: string,
  meta?: Json
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Casting to any because the types are not updated with the new table yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('analytics_events' as any) as any).insert({
      event_type: eventType,
      group_id: groupId,
      show_id: showId || null,
      user_id: user?.id || null,
      meta: meta || null
    });

    if (error) {
      console.error('Error tracking event:', error);
    }
  } catch (error) {
    console.error('Error in trackEvent:', error);
  }
};
