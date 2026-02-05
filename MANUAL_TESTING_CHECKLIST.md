# 🧪 Manual Testing Checklist

This document provides a final manual verification checklist for the StageLink platform. While automated tests cover ~100% of the critical paths, these manual checks ensure the "feel" and specific integrations (like payments and ads) work as expected in a real browser environment.

---

## 🛠 1. Pre-Flight Configuration Checks
*Before testing, ensure your environment is correctly set up.*

- [ ] **Environment Variables**: Check `.env` or your deployment settings.
    - [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.
    - [ ] `VITE_PAYMONGO_PUBLIC_KEY` is set (Use Test Key for testing, Live Key for production).
- [ ] **Database Connection**: Ensure Supabase project is active and not paused.
- [ ] **Edge Functions**: Verify `send-show-reminder` and other functions are deployed.

---

## 👤 2. Authentication & Accounts

### Sign Up & Login
- [ ] **Sign Up (Audience)**: Create a new account with email/password. Verify redirection to `/shows` (or onboarding).
- [ ] **Sign Up (Producer)**: Create a new account, check the "I am a Producer" box. Verify redirection to Onboarding Tour.
- [ ] **Login**: Log out and log back in. Ensure session persists on refresh.
- [ ] **Invalid Login**: Try logging in with a wrong password. Verify error message appears.
- [ ] **Logout**: Click Logout. Verify redirection to Landing Page or Login.

### Profile
- [ ] **Update Profile**: Go to Settings. Update `group_name` (if producer) or `username` (if available). Save and refresh to verify persistence.

---

## 🎭 3. Core User Flows (Viewer)

### Browsing Shows
- [ ] **Shows List**: Scroll down the `/shows` page. Verify "Load More" works or infinite scroll triggers.
- [ ] **Filtering**:
    - [ ] Filter by **City**. Verify the list updates.
    - [ ] Filter by **Genre**. Verify the list updates.
    - [ ] Clear filters. Verify full list returns.
- [ ] **Search**: Type in the search bar. Verify results update in real-time or after enter.

### Show Details
- [ ] **View Details**: Click a show card. Ensure `ShowDetailsPage` loads.
- [ ] **Calendar**: Click "Add to Calendar". Verify it opens Google Calendar with correct details.
- [ ] **Location Map**: Verify the "Get Directions" link opens Google Maps.

### Interaction
- [ ] **Review**: (As Viewer) Submit a 5-star review. Verify:
    - [ ] XP is awarded (+50 XP).
    - [ ] Review appears in the list immediately (or after refresh).
- [ ] **Favorite**: Click the Heart icon. Verify it turns red immediately (optimistic UI). Refresh to ensure it stayed red.

---

## 🎬 4. Core User Flows (Producer)

### Dashboard
- [ ] **Stats**: Check the dashboard stats (Total Shows, Views). They should not be `NaN`.

### Show Management
- [ ] **Create Show**: Click "Add Show".
    - [ ] Upload an image.
    - [ ] Select dates.
    - [ ] Fill title, description, ticket link.
    - [ ] Submit. Verify success message and redirection.
- [ ] **Edit Show**: Edit the show you just created. Change the title. Save. Verify change is reflected.
- [ ] **Delete Show** (if available): Delete a test show. Verify it disappears from the list.

### Onboarding
- [ ] **Tour**: Create a new Producer account. Verify the "Tour Guide" tooltips appear and guide you through the dashboard.

---

## 💳 5. Payments (PayMongo)
*Refer to `PAYMENT_TESTING.md` for specific card details.*

- [ ] **Upgrade Flow**: Go to Settings -> Subscription -> "Upgrade Pro".
- [ ] **Checkout**:
    - [ ] Verify redirection to PayMongo checkout.
    - [ ] Use Test Card: `4343 4343 4343 4345` (Visa).
    - [ ] Expiry: Any future date. CVC: Any 3 digits.
- [ ] **Success**: Complete payment. Verify redirection back to StageLink.
- [ ] **Verification**: Check that your account now has "Pro" status (e.g., check Settings or XP/Badge).

---

## 📢 6. Ads & Monetization
*Refer to `ADS_GUIDE.md`.*

- [ ] **AdSense**: Open a page with ads (e.g., Feed).
    - [ ] Verify `ins` tags are present in the DOM.
    - [ ] (Production only) Verify real ads render. (Localhost may show blank spaces).
    - [ ] Check Browser Console for AdSense errors (403/400 is common on localhost, ignore if `origin` related).
- [ ] **Sponsorships**: If configured, verify the custom sponsorship banner appears in the sidebar.
- [ ] **Responsiveness**: Resize window. Ensure ads do not break the layout or cause horizontal scroll on mobile.

---

## 📱 7. UI/UX & Responsive Design

### Mobile Check (Use DevTools Device Mode)
- [ ] **Navigation**: Verify the Bottom Navigation Bar appears on mobile (iPhone SE/XR size).
- [ ] **Menu**: Open the Hamburger menu (if applicable). Links should work.
- [ ] **Cards**: Show cards should stack vertically, not squished.

### Visual Polish
- [ ] **Marquee**: On the Landing Page, verify the scrolling marquee at the bottom is smooth and doesn't overlap content inappropriately.
- [ ] **Loading States**: Navigate quickly. Verify "Loading..." skeletons or spinners appear briefly.
- [ ] **404 Page**: Go to `/random-url`. Verify the 404 page looks good and has a "Go Home" button.

---

## 🚨 8. Edge Cases

- [ ] **Network Offline**: (DevTools -> Network -> Offline). Try to navigate. Verify app doesn't crash (might show browser error, but app state should handle reconnection if possible).
- [ ] **Empty States**:
    - [ ] Go to "Favorites" with no favorites. Verify "No favorites yet" message.
    - [ ] Search for "QWERTY12345". Verify "No shows found".
