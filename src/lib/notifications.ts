import { supabase } from "@/integrations/supabase/client";

interface CreateNotificationParams {
  userId: string; // The recipient of the notification
  actorId?: string; // The user who triggered the notification (optional)
  type: string; // 'like', 'follow', 'membership_application', etc.
  title: string;
  message: string;
  link?: string;
}

export const createNotification = async ({
  userId,
  actorId,
  type,
  title,
  message,
  link
}: CreateNotificationParams) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_id: actorId,
        type,
        title,
        message,
        link,
        read: false
      } as any); // Type assertion needed until types are updated

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't block the UI if notification fails
  }
};
