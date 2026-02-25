# Changelog

All notable changes to StageLink will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2024-12-14

### 🎉 Phase 1: Foundation Release

First public release of StageLink — a digital platform connecting audiences with local and university theater productions in Metro Manila.

### Added

#### Core Features
- **Show Listings Management** — Producers can create, edit, and manage theater productions
- **Theater Directory** — Browse and discover local & university theater groups
- **City-Based Discovery** — Find shows by location (Manila, Quezon City, Makati, Pasay, etc.)
- **Favorites** — Audiences can save shows they're interested in
- **Ticket Link Integration** — Direct links to ticket purchase pages
- **Group Profiles** — Dedicated pages for theater groups with history and social links
- **Team Member Showcase** — Display cast and crew with roles and photos
- **Admin Approval Workflow** — All shows reviewed before public visibility

#### Authentication & Security
- Email/password authentication via Supabase Auth
- Role-based access control (Audience, Producer, Admin)
- Row-Level Security (RLS) on all database tables
- 30-minute session timeout with 5-minute warning modal
- Password strength validation (8+ chars, 1 number/special char)

#### User Experience
- Dark theater aesthetic with maroon and gold accents
- iOS-inspired smooth animations and transitions
- Responsive design for mobile and desktop
- Skeleton loaders for async content
- Branded loading spinner with StageLink logo
- Page transitions with fade-scale effects
- Scroll-to-top button on landing page

#### Landing Page
- Hero section with call-to-action
- Mission section explaining platform purpose
- Features section (8 feature cards)
- Pricing section (Free tier + Pro Producer coming soon)
- Roadmap section (Phase 1-3 timeline)
- FAQ section (7 common questions)
- Showcase section with production photos
- Smooth scroll navigation with navbar offset

#### Dashboard Features
- Producer Dashboard with show management
- Admin Panel with user management and stats
- Show submission form with poster upload
- Group member management (add/edit/delete)
- Producer request workflow for role upgrades

#### Mobile Optimizations
- Collapsible filters on Shows page
- Mobile bottom navigation bar
- Collapsible sidebar on dashboards
- 2-column footer layout on mobile
- Touch-friendly UI elements

### Technical
- React 18 with TypeScript
- Vite build system
- Tailwind CSS with custom design tokens
- shadcn/ui component library
- Framer Motion for animations
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Lovable Cloud hosting

---

## [Unreleased]

### Planned for Phase 2 (Q1 2025)
- Real-time analytics dashboard
- Email notifications via Resend
- Enhanced rich media profiles
- Social login (Google OAuth)
- Show performance insights

### Planned for Phase 3 (Q2 2025)
- Mobile app (iOS & Android)
- Pro subscriptions & payments
- Calendar sync & reminders
- Audience reviews & ratings
- National expansion beyond Metro Manila

---

## Version History

| Version | Date | Phase | Status |
|---------|------|-------|--------|
| 1.0.0 | 2024-12-14 | Phase 1: Foundation | ✅ Released |
| 1.1.0 | Q1 2025 | Phase 2: Growth | 🔜 Planned |
| 2.0.0 | Q2 2025 | Phase 3: Scale | 📋 Roadmap |

---

*Maintained by La Creneurs*
