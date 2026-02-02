# 🎭 StageLink

**A digital platform connecting audiences with local and university theater productions in Metro Manila.**

Built by [La Creneurs](https://stagelink.show) — because every performance deserves an audience.

---

## 📋 Phase 1 - Foundation (Now Live)

### Features

#### For Audiences
- 🔍 **Theater Directory** — Browse and discover local & university theater groups
- 📍 **City-Based Discovery** — Find shows in Manila, Quezon City, Makati, and more
- ❤️ **Favorites & Watchlist** — Save shows you're interested in
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
| Email | Resend (Phase 2) |
| Hosting | Lovable Cloud |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase project (auto-configured via Lovable Cloud)

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd stagelink

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables
Environment variables are automatically configured via Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

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
- Favorites & watchlist

### Phase 2: Growth (Q1 2025)
- Real-time analytics dashboard
- Email notifications
- Enhanced rich media profiles
- Social login (Google)
- Show performance insights

### Phase 3: Scale (Q2 2025)
- Mobile app (iOS & Android)
- Pro subscriptions & payments
- Calendar sync & reminders
- Audience reviews & ratings
- National expansion

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
