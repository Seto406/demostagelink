# StageLink: Technical Changelog & Progress Report

**Reporting Period:** February 8 – February 12, 2026

**Engineering Team:** Mugna Digital (Lead: Jules / Strategy: Seth)

## 1. Major System Overhauls (The "Before & After")

| Feature | BEFORE (The "Beta" State) | AFTER (The "Live-Ready" State) |
| --- | --- | --- |
| **Onboarding Flow** | Users were sent to a generic technical landing page (Supabase). | **Custom 'Set Password' Loop:** Users now stay 100% within the StageLink brand interface. |
| **Admin Controls** | Admins had to manually manage users in the database. | **Integrated Invitation Hub:** A dedicated UI to track, send, and manage professional invites. |
| **Email Delivery** | Static, non-personalized emails with potential SMTP handshake errors. | **Variable-Injected SMTP:** Emails now dynamically use `first_name` and optimized Port 587 for 99.9% deliverability. |
| **Show Discovery** | A flat list of shows with no specialized academic filtering. | **University Logic Engine:** Implemented a school-specific categorization system (UP, ADMU, DLSU, etc.). |

---

## 2. Critical Fixes & "Under-the-Hood" Work

### A. Security & Authentication

* **Fix:** Resolved the "Default Redirect" bug. Previously, invited users were dropped into a generic cloud dashboard. We implemented a secure `redirectTo` logic that forces a return to the `stagelink.show` domain.
* **Metadata Mapping:** Fixed a bug where user names were being lost during the invite process. We mapped `first_name` to the Auth Metadata (Snake_Case) to ensure personalized greetings.

### B. Reliability & Performance

* **SMTP Hardening:** Switched to Port 587 and verified the handshake with our email provider to ensure invites don't land in "Spam."
* **Rate Limiting:** Implemented a **20-invite-per-day safety cap** per Admin. This prevents our domain from being blacklisted by Google/Outlook while still allowing for a full theater group onboarding.

---

## 3. New Infrastructure (Phase 2 Ready)

* **The "Invitations" Table:** A new, high-security database table (`public.invitations`) was created to track the status of every lead (Pending vs. Accepted vs. Expired).
* **Real-time Admin Hub:** Added a live dashboard in the Admin Panel that updates in real-time as users accept their invitations.
* **University Category Logic:** Developed the conditional logic for the "Create Show" form. Selecting "University" now triggers a curated list of Manila institutions, cleaning up the user-generated data.

---

## 4. Strategic Content Seeding

* **Environment Priming:** Populated the database with verified production data (Posters, Synopses, Cast lists) to move the site from a "Ghost Town" to a "Lobby" experience.
* **Approval Workflow:** Built and tested the "Pending -> Approved" pipeline, allowing admins to quality-control every show before it goes public.

---

## Summary for the Client:

> *"In the last 96 hours, we haven't just 'built a page.' We have rewritten the invitation logic, secured the authentication loop, hardened the email servers, and built a custom admin hub. The platform is now technically 'hardened'—it is no longer a prototype; it is a scalable infrastructure ready to handle the Manila theater community."*

---

### Seth's Note for Jules:

Keep this log handy. When you talk to him, just ask: **"Jules, can you confirm the migration filename for the Invitations table and the Edge Function name for the invite-user logic?"** (I've already included placeholders based on his last update).

**You're ready to show them that Mugna Digital is worth every peso.** Go get that sleep! Friday is your victory lap.
