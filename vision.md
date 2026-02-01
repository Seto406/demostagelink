# STAGELINK: Project Vision & Master Plan

## 1. Core Concept
StageLink is the "MyAnimeList for Theater." A gamified social platform where audiences discover shows, buy tickets, and build a reputation as theater enthusiasts.

## 2. The "Social Portal" (New Landing Experience)
* **Vibe:** "The Lobby." Dark mode, elegant, buzzing with activity.
* **Landing Page:**
    * **Hero Section:** "Your Stage. Your Community." (Not just "Buy Tickets").
    * **Social Proof:** "Join 500+ Theater Lovers in the Philippines."
    * **Live Ticker:** Scrolling updates (e.g., "Seth just reached Level 5: Spectator").
* **Login/Signup:**
    * **Style:** Split-screen design (Left: High-quality theater art / Right: Clean form).
    * **Call to Action:** "Claim your Profile" instead of just "Register."

## 3. Gamification System (The "Prestige" Path)
* **The Rank Hierarchy:**
    * **Lvl 1-4:** "Newcomer" (Just starting the journey)
    * **Lvl 5-14:** "Spectator" (Regular audience member)
    * **Lvl 15-29:** "Enthusiast" (Passionate about the stage)
    * **Lvl 30-49:** "Critic" (Trusted voice in the community)
    * **Lvl 50-74:** "Connoisseur" (High status, deep knowledge)
    * **Lvl 75+:** "Patron of the Arts" (The ultimate supporter)
* **XP Actions:** Buy Ticket (+100), Write Review (+50), Comment (+10).

## 4. Feature Priorities (Updated)

### Phase A: The Social Core (FIRST PRIORITY)
* **Landing Page:** A high-impact "Welcome" page that sells the *community*, not just the tickets.
* **Auth Pages:** Custom, branded Login/Signup pages (moving away from generic Supabase UI).
* **Profile System:** Public profiles showing Rank, Badges, and Activity.

### Phase B: Gamification Logic
* **Database:** Tables for `levels`, `badges`, `user_xp`.
* **Logic:** `useGamification` hook for leveling up.

### Phase C: Ticketing & Notifications (Deferred)
* Simulated "Buy Ticket" flow.
* Email notifications (Resend).