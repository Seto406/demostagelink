# 🎭 StageLink

**A digital platform connecting audiences with local and university theater productions in Metro Manila.**

Built by [La Creneurs](https://www.stagelink.show) — because every performance deserves an audience.

---

## 📋 Phase 2 - General Availability (Now Live)

### Features

#### For Audiences
- 🔍 **Theater Directory** — Browse and discover local & university theater groups
- 📍 **City-Based Discovery** — Find shows in Manila, Quezon City, Makati, and more
- ❤️ **Favorites** — Save shows you're interested in
- 🎫 **Show Details** — View production info, venue, dates, and ticket links
- 👥 **Group Profiles** — Explore theater group history, team members, and social links

#### For Producers (Theater Groups)
- 📝 **Show Listings Management** — Create, edit, and manage productions
- 🎟️ **Ticket Link Integration** — Add direct purchase links to shows
- 👤 **Group Profile** — Showcase your theater group with avatars and social links
- 🎭 **Team Member Showcase** — Display cast and crew with roles and photos
- 📊 **Submission Tracking** — Monitor approval status of your shows

#### For Admins
- ✅ **Approval Workflow** — Review and approve/reject show submissions
- 👥 **User Management** — Manage users and producer requests
- 📈 **Platform Stats** — View total users, shows, and active producers

### Security Features
- 🔐 Row-Level Security (RLS) on all database tables
- ⏰ 30-minute session timeout with warning modal
- 🔑 Role-based access control (Audience/Producer/Admin)
- ✅ Admin approval required for all show listings

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Animations | Framer Motion |
| Email | Resend |
| Hosting | Lovable Cloud |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20 and pnpm
- Supabase project

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd demostagelink

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run a local health check (lint + typecheck)
pnpm health:check
```

### Environment Variables (Vercel)
Set these in your Vercel project settings (do not commit `.env` files):

**Client (safe to expose via Vite):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PROJECT_ID` (optional)

**Server-only (must never be `VITE_*`):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ACTION_KEY`

Use `.env.example` as the template for local values.

### Admin Actions Flow
- The frontend calls Vercel API routes under `/api/admin/*`.
- The API route verifies the caller is an admin and checks `ADMIN_ACTION_KEY`.
- Privileged actions (like deleting users) run server-side with `SUPABASE_SERVICE_ROLE_KEY`.

---

## 🔒 Security Notes
- Secrets were previously committed in this repository. Rotate any exposed keys immediately, especially `SUPABASE_SERVICE_ROLE_KEY` and any admin keys.
- If this repository was public, scrub git history to permanently remove leaked secrets.
- Never store privileged secrets in `VITE_*` variables because Vite bundles them into client code.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── landing/      # Landing page sections
│   ├── layout/       # Navbar, Footer
│   ├── ui/           # Reusable UI components
│   └── dashboard/    # Producer dashboard components
├── pages/            # Route pages
├── contexts/         # Auth context
├── hooks/            # Custom React hooks
├── providers/        # App providers (IdleTimer)
└── integrations/     # Supabase client & types

supabase/
├── functions/        # Edge functions
└── config.toml       # Supabase configuration
```

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅ (Current)
- Show listings & management
- Group profiles & directory
- Ticket link integration
- Team member showcase
- City-based discovery
- Favorites

### Phase 2: Growth ✅ (Released Q1 2026)
- Real-time analytics dashboard
- Email notifications
- Enhanced rich media profiles
- Social login (Google)
- Show performance insights
- Calendar sync & reminders
- Audience reviews & ratings
- National expansion

### Phase 3: Scale (Q2 2026)
- Mobile app (iOS & Android) - *Coming Soon*
- Pro subscriptions & payments - *Waitlist Open*

*Roadmap is for discussion purposes and is not final.*

---

## 👥 User Roles

| Role | Capabilities |
|------|--------------|
| **Audience** | Browse shows, save favorites, view group profiles |
| **Producer** | All audience features + submit/manage shows, edit group profile |
| **Admin** | All features + approve shows, manage users, view stats |

---

## 📧 Contact

- **Email:** connect.stagelink@gmail.com
- **Facebook:** [@stagelinkonfb](https://www.facebook.com/stagelinkonfb/)
- **Instagram:** [@stagelinkonig](https://www.instagram.com/stagelinkonig/)
- **TikTok:** [@stagelinkontiktok](https://www.tiktok.com/@stagelinkontiktok)
- **X:** [@stagelinkonx](https://x.com/stagelinkonx)

---

## 📄 License

This project is proprietary software owned by La Creneurs.

---

*Built with ❤️ for Philippine theater*

---

## 🚀 Deployment Notes

- Apply the latest SQL migration in Supabase (SQL Editor or Supabase CLI), including theater group RLS policy updates before deploying.
- Collaboration proposals now use the Vercel API route `POST /api/send-collab-proposal` with Supabase token validation on the server.
- Vercel server env vars required for collaboration proposals: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and optional `SITE_URL`.
- If collaboration request inserts fail, non-production environments return Supabase `code`, `message`, `details`, and `hint` in the API response for debugging; production keeps a generic error only.
- No Supabase Edge Function deploy is needed for the collaboration proposal flow.
- Producer theater-group saves rely on `profiles.id` ownership for `theater_groups.owner_id`; ensure producer profiles exist before saving.
- Producer edit modals now save unsaved drafts to `sessionStorage` per route + modal + user key, so transient refreshes won't drop in-progress form data.
