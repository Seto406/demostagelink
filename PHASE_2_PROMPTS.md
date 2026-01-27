# Phase 2 Implementation Prompts

Use these prompts to guide the implementation of Phase 2 features. Each prompt is designed to be self-contained but may depend on previous steps (e.g., database schema changes).

---

## 1. Social Login (Google OAuth)

**Context:** Users currently only have email/password login. We need to add Google OAuth to reduce friction for new users.

**Prompt:**
```markdown
Implement Google OAuth Social Login for the StageLink application.

1.  **Auth Context**: Update `src/contexts/AuthContext.tsx` to include a `signInWithGoogle` function using `supabase.auth.signInWithOAuth()`. Ensure it handles the redirect URL correctly for the environment.
2.  **Login Page**: Modify `src/pages/Login.tsx` to add a "Sign in with Google" button above the email/password form. Use the Google icon from `lucide-react` or an asset.
3.  **Handling Redirects**: Ensure that after a successful Google login, the user is redirected to the `/feed` (for audience) or `/dashboard` (for producers) based on their metadata or default logic.
4.  **Profile Creation**: Verify that the existing `handle_new_user` Postgres function correctly creates a profile row for Google users (it currently triggers on `auth.users` insert, which should still work, but verify `raw_user_meta_data` handling).
5.  **Styling**: Use `shadcn/ui` buttons and ensure the design matches the existing dark theme aesthetics.
```

---

## 2. Rich Media Profiles (Gallery & Video)

**Context:** Producer profiles are currently limited to text and an avatar. We want to allow theater groups to showcase their work with a photo gallery and a video highlight.

**Prompt:**
```markdown
Enhance Producer Profiles to support Rich Media (Photo Gallery and Video URL).

1.  **Database Schema**:
    *   Create a migration to add `gallery_images` (text array) and `video_url` (text) columns to the `profiles` table.
    *   Update RLS policies if necessary to allow producers to update these specific columns.
2.  **Producer Dashboard**:
    *   Update the "Profile" tab in `src/pages/Dashboard.tsx` to include an interface for uploading multiple images (limit 6) and entering a YouTube/Vimeo URL.
    *   Use Supabase Storage bucket `gallery` (create if needed) for storing images.
3.  **Public Profile Page**:
    *   Update `src/pages/ProducerProfile.tsx` to display the video embed (if present) prominently.
    *   Add a masonry or grid layout section for `gallery_images` with a lightbox effect (using `framer-motion` layout animations).
4.  **Types**: Update `src/integrations/supabase/types.ts` to reflect the schema changes.
```

---

## 3. Real-Time Analytics (Admin Panel)

**Context:** The Admin Panel currently fetches stats once on load. We want to see live updates as users sign up or shows are submitted.

**Prompt:**
```markdown
Implement Real-Time Analytics updates for the Admin Panel.

1.  **Real-Time Subscription**:
    *   In `src/pages/AdminPanel.tsx`, replace the static `fetchStats` logic with a Supabase Realtime subscription (`supabase.channel().on(...)`).
    *   Listen for `INSERT`, `UPDATE`, and `DELETE` events on `profiles`, `shows`, and `producer_requests` tables.
2.  **State Management**:
    *   Update the `stats` state object dynamically when an event is received (e.g., increment `totalUsers` on new profile insert).
3.  **Visual Feedback**:
    *   Add a small "Live" indicator (green pulsing dot) next to the "Platform Stats" header to verify the connection is active.
4.  **Verification**: Ensure the subscription is cleaned up (`channel.unsubscribe()`) when the component unmounts.
```

---

## 4. Producer Performance Insights (Charts)

**Context:** Producers have no visibility into how their shows are performing. We need to track views and display basic insights.

**Prompt:**
```markdown
Implement Show Performance Insights for the Producer Dashboard.

1.  **Analytics Schema**:
    *   Create a new table `analytics_events` with columns: `id`, `show_id`, `event_type` (e.g., 'view', 'click'), `created_at`.
    *   Enable RLS to allow public inserts (anon users viewing shows) but restricted select (only producers own their data).
2.  **Tracking**:
    *   Update `src/pages/ShowDetailsPage.tsx` to insert a 'view' event into `analytics_events` when the page loads (use `useEffect` with a strict run-once check).
    *   Track clicks on the "Get Tickets" button.
3.  **Dashboard Visualization**:
    *   Install `recharts` for data visualization.
    *   In `src/pages/Dashboard.tsx` (create a new "Insights" tab), fetch analytics data for the producer's shows.
    *   Display a Bar Chart showing "Views per Show" and a Line Chart showing "Total Views Over Time" (last 30 days).
```

---

## 5. Enhanced Email Notifications (Reminders)

**Context:** We currently have basic emails. We need to implement show reminders for audiences who "favorite" a show.

**Prompt:**
```markdown
Implement Automated Show Reminders for Audience Members.

1.  **Database**:
    *   Verify the `show_reminders` table exists (or create it: `user_id`, `show_id`, `reminder_sent`).
    *   Ensure the `favorites` function/table can be used as a proxy for interest, or use explicit reminders.
2.  **Edge Function**:
    *   Create a new Supabase Edge Function `send-show-reminders`.
    *   Logic: Query shows happening *tomorrow*. Find all users who favorited these shows.
    *   Filter out users who have already been sent a reminder for that show.
    *   Loop through and send emails using the existing Resend integration.
    *   Mark the reminder as sent in the database.
3.  **Scheduling**:
    *   Set up a Supabase Cron Job (via pg_cron extension) to invoke this function every day at 9:00 AM Manila time.
    *   `select cron.schedule('0 1 * * *', 'select net.http_post(...)');`
```
