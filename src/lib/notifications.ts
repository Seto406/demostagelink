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
  // Don't notify users of their own actions
  if (userId === actorId) return;

  try {
    // Try to insert with actor_id first
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
      // If the error is about the missing actor_id column, retry without it
      if (error.message?.includes('column "actor_id" of relation "notifications" does not exist') ||
          error.code === '42703') { // Postgres error code for undefined column
        console.warn('actor_id column missing in notifications table, retrying without it...');

        const { error: retryError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type,
            title,
            message,
            link,
            read: false
          });

        if (retryError) {
          console.error('Error creating notification (retry):', retryError);
          throw retryError;
        }
        return;
      }

      console.error('Error creating notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't block the UI if notification fails
  }
};
