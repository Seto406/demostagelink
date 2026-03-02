# StageLink Product Plan (No Gamification)

## 1. Executive Summary
- Ship an **Audience Identity & Social Proof** release first to increase trust and decision confidence: richer profiles (display name + bio), stronger review visibility, and social signal modules (Popular this week, Recently reviewed, Recently listed).
- Focus phase sequencing on conversion: improve discovery quality before expanding producer analytics depth, so producer tools can optimize behavior that is already instrumented.
- Preserve existing strengths (show listings, city discovery, favorites, producer dashboard basics) and layer targeted improvements rather than rebuilding core flows.
- Build recommendations around practical audience context (city, favorites, and browsing behavior) and reinforce intent with reminder/follow notifications.
- Standardize loading/empty/error/retry states across discovery surfaces to reduce drop-off caused by unclear system feedback.
- Expand producer analytics from raw traffic counts to decision-ready insights (conversion signals, trend summaries, and explicit CTA guidance tied to measurable outcomes).
- Align all roadmap outputs to non-gamified utility and social proof, explicitly excluding XP, badges, levels, streaks, and rank ladders.

## 2. Prioritized Roadmap

### Phase A (Now): Audience Identity & Social Proof

**Objectives**
- Increase trust in recommendations and listings via visible audience identity and credible social proof.
- Improve consideration-to-click conversion by surfacing quality signals near decision points.

**Feature List**
- Audience profile enhancements: display name, profile bio, review count, and recent activity summary.
- Review/rating visibility improvements:
  - Aggregate show rating block on cards and details.
  - “Most helpful” and “most recent” review sorting.
  - Minimum moderation tools for producers/admins (report/hide queue).
- Discovery social modules:
  - Popular this week (by weighted recent clicks/favorites/reviews).
  - Recently reviewed (latest audience commentary with show context).
  - Recently listed (newly published shows with freshness labels).

**Dependencies**
- Profile schema updates (display name/bio constraints, migration backfill rules).
- Review data quality rules (anti-spam thresholds, moderation status).
- Ranking service/query logic for weekly popularity.

**Risks**
- Low review volume can make social modules look sparse.
  - Fallback: render module with editorial defaults and clear “be the first to review” prompts.
- New moderation workload may strain operations.
  - Fallback: start with report-only flow and SLA-based moderation.

---

### Phase B (Next): Discovery & Retention

**Objectives**
- Raise repeat discovery sessions and ticket-intent actions through personalization and reminders.
- Reduce session abandonment by strengthening state handling and reliability cues.

**Feature List**
- Personalized recommendations:
  - Inputs: city, favorites, prior clicks, category affinity.
  - Placements: home feed, city browse, “Because you liked…” module.
- Follow/reminder notifications:
  - Follow theater groups/producers.
  - Show reminder opt-ins (24h and 2h before showtime, user configurable).
  - Notification center + email fallback.
- UX reliability framework:
  - Shared loading skeletons for list/detail states.
  - Contextual empty states with recovery CTA.
  - Standardized error/retry components with telemetry events.

**Dependencies**
- Event tracking completeness for recommendation inputs.
- Notification delivery infrastructure (in-app + email jobs).
- Frontend component library support for state patterns.

**Risks**
- Over-notification can increase churn/unsubscribes.
  - Fallback: conservative default frequency and digest option.
- Personalization cold-start for new users.
  - Fallback: city + popularity blend until behavior signals mature.

---

### Phase C (Then): Producer Growth Tools

**Objectives**
- Convert producer dashboards from reporting surfaces into action surfaces.
- Help producers identify what to change next to improve ticket click-through and sales outcomes.

**Feature List**
- Analytics expansion:
  - Funnel view: impression → show detail view → ticket click.
  - Segment cuts: city, channel source, new vs returning audiences.
  - Trend summaries: week-over-week movement and anomaly flags.
- Conversion signals:
  - Reminder-to-click uplift.
  - Review sentiment snapshot and correlation with ticket clicks.
  - Top-performing listing attributes (poster quality, copy length, timing window).
- Outcome-tied CTAs in dashboard:
  - “Improve listing quality” checklist.
  - “Schedule reminder push” action.
  - “Promote to similar audience segments” suggestions.

**Dependencies**
- Clean attribution pipeline across listing/detail/ticket outbound flow.
- Metrics definitions aligned across product, data, and producer success.
- Dashboard query performance and caching.

**Risks**
- Attribution ambiguity (external ticketing handoff).
  - Fallback: proxy conversion model using verified outbound click + partner reconciliation.
- Producer feature complexity may reduce adoption.
  - Fallback: progressive disclosure (basic insights first, advanced filters optional).

## 3. Implementation Backlog

### Epic A1: Audience Identity Foundation

**Story A1.1: Add display names and bios to audience profiles**
- Acceptance Criteria:
  - Users can add/edit display name and bio from profile settings.
  - Validation blocks offensive terms and over-limit text.
  - Public profile reflects updates within one refresh cycle.
- Engineering Notes:
  - Frontend: profile edit form, inline validation, optimistic save state.
  - Backend: profile schema migration + API update.
  - Data: backfill null display names from existing username fallback.

**Story A1.2: Profile card social proof block**
- Acceptance Criteria:
  - Profile card shows review count and most recent review timestamp.
  - Empty state shown if user has no reviews.
- Engineering Notes:
  - Frontend: reusable profile summary component.
  - Backend: profile summary endpoint/aggregation query.
  - Data: cached derived metrics for read performance.

### Epic A2: Review Visibility & Quality

**Story A2.1: Improve review sorting and prominence**
- Acceptance Criteria:
  - Show details can sort reviews by most recent and most helpful.
  - Default sort set to hybrid relevance (freshness + helpfulness).
- Engineering Notes:
  - Frontend: sort controls and review card metadata.
  - Backend: query params + ranking function.
  - Data: helpful-vote table/index and anti-duplication constraints.

**Story A2.2: Review moderation queue (minimum viable)**
- Acceptance Criteria:
  - Users can report a review.
  - Admin/producers can hide reported reviews with reason codes.
  - Moderation actions are auditable.
- Engineering Notes:
  - Frontend: report modal + moderation table.
  - Backend: moderation endpoints and access policies.
  - Data: status transitions (active/reported/hidden).

### Epic A3: Social Discovery Modules

**Story A3.1: Popular this week module**
- Acceptance Criteria:
  - Home and city pages show ranked list of popular shows updated daily.
  - If fewer than threshold shows exist, blend with editorial picks.
- Engineering Notes:
  - Frontend: horizontal module component with card reuse.
  - Backend: ranking RPC/job.
  - Data: weighted scoring table with daily refresh.

**Story A3.2: Recently reviewed and recently listed modules**
- Acceptance Criteria:
  - Modules display latest reviewed/listed shows with timestamp labels.
  - Clicking module items opens show detail pages.
- Engineering Notes:
  - Frontend: lightweight feed modules.
  - Backend: recency queries with pagination.
  - Data: index on created_at and last_reviewed_at.

### Epic B1: Personalization & Recommendations

**Story B1.1: Recommendation model v1 (rules + lightweight scoring)**
- Acceptance Criteria:
  - Recommendations account for city and favorites at minimum.
  - Behavior signals (click categories, viewed shows) improve ranking when available.
  - Cold-start users receive city + popular blend.
- Engineering Notes:
  - Frontend: recommendation slots + explanation text.
  - Backend: recommendation service endpoint.
  - Data: event ingestion and user preference feature table.

### Epic B2: Reminder & Follow Notifications

**Story B2.1: Show reminders**
- Acceptance Criteria:
  - Users can opt into reminders from show details/favorites.
  - Scheduled notifications send at 24h/2h defaults.
  - Users can opt out in one tap.
- Engineering Notes:
  - Frontend: reminder toggle states + settings controls.
  - Backend: scheduling and delivery worker.
  - Data: reminder subscription table + delivery logs.

**Story B2.2: Follow groups/producers**
- Acceptance Criteria:
  - Users can follow/unfollow groups from profile/listing pages.
  - New show notifications triggered for followed groups.
- Engineering Notes:
  - Frontend: follow button and follower state sync.
  - Backend: follow graph APIs + fanout logic.
  - Data: follow edges table, dedup constraints.

### Epic B3: UX Reliability States

**Story B3.1: Unified loading/empty/error/retry states**
- Acceptance Criteria:
  - Core discovery surfaces use shared state components.
  - Error states include retry and context-specific fallback content.
  - Telemetry captures retries and recovery rates.
- Engineering Notes:
  - Frontend: component library additions and page integration.
  - Backend: standard error payloads.
  - Data: telemetry schema for state transitions.

### Epic C1: Producer Analytics Evolution

**Story C1.1: Conversion funnel dashboard**
- Acceptance Criteria:
  - Producers can view impression→detail→ticket click funnel by show/date range.
  - Funnel supports city and audience segment filters.
- Engineering Notes:
  - Frontend: funnel visualization + filters.
  - Backend: analytics query endpoints.
  - Data: normalized event model and aggregation jobs.

**Story C1.2: Trend summary and action CTAs**
- Acceptance Criteria:
  - Dashboard displays week-over-week highlights and top recommended actions.
  - CTA clicks are tracked and attributable to subsequent conversion movement.
- Engineering Notes:
  - Frontend: insight cards + CTA panel.
  - Backend: recommendation logic for producer actions.
  - Data: experiment/event instrumentation for CTA effectiveness.

## 4. Success Metrics (KPI Tree)

**North Star Metric**
- Discovery-to-ticket-click conversion rate (sessions with show discovery that lead to outbound ticket click).

**Supporting Metrics**
- Discovery quality
  - Show detail click-through rate from discovery modules.
  - Personalized recommendation CTR.
- Retention and intent
  - Reminder opt-in rate.
  - Follow rate for groups/producers.
  - Return visits (7-day and 30-day).
- Social proof health
  - Review participation rate (reviewers / ticket-click users).
  - Average reviews per active show.
  - Review helpfulness interaction rate.
- Producer outcomes
  - Producer activation rate (new producer who completes first listing + dashboard visit).
  - Analytics engagement rate (weekly active producers viewing analytics).
  - Producer CTA adoption and post-CTA conversion lift.

## 5. 30/60/90-Day Plan

### Day 0–30
**Deliverables**
- Profile display name/bio release.
- Review sort improvements and basic moderation reporting.
- Social modules MVP: Recently listed + Recently reviewed.
- Instrumentation baseline for conversion funnel events.

**Targets**
- +10% review impressions per session.
- 95% event capture completeness on discovery/detail/ticket-click flow.

### Day 31–60
**Deliverables**
- Popular this week module live.
- Recommendation model v1 in home and city browse.
- Reminder opt-in and scheduled notification pipeline.
- Unified loading/empty/error/retry components on top 5 discovery surfaces.

**Targets**
- +8% relative lift in discovery-to-detail CTR.
- Reminder opt-in ≥ 15% of users who favorite a show.
- Error-recovery retry success ≥ 40% on failed requests.

### Day 61–90
**Deliverables**
- Follow groups/producers with notification fanout.
- Producer funnel dashboard (impression→detail→ticket click).
- Trend summaries + outcome-tied producer CTAs.
- KPI review and next-cycle optimization brief.

**Targets**
- +12% relative lift in discovery-to-ticket-click conversion vs baseline.
- 20% weekly analytics engagement among active producers.
- 7-day return visits +10% relative lift.

## 6. Copy Suggestions

### Hero
- “Find theater shows that fit your city and taste—then book in a tap.”
- “Discover what audiences are watching now, with real reviews you can trust.”

### Social Proof Modules
- Popular this week: “What theatergoers are clicking this week.”
- Recently reviewed: “Fresh audience reviews, posted this week.”
- Recently listed: “Just added: new productions near you.”

### Onboarding
- “Pick your city and favorite show types to personalize your feed.”
- “Turn on reminders so you never miss opening night.”

### Producer Analytics Messaging
- “See where audiences drop off from discovery to ticket click.”
- “Get practical recommendations to improve listing performance.”
- “Track conversion trends and act on what’s changing this week.”

## 7. Risk Register + Mitigations

- **Product Risk: Low review participation limits social proof value.**
  - Mitigation: trigger review prompts post attendance/ticket click windows; prioritize lightweight review UX.
- **Technical Risk: Recommendation relevance is weak in early rollout.**
  - Mitigation: start with interpretable rule-based ranking + A/B test against popularity baseline.
- **Data Risk: Incomplete attribution for external ticketing destinations.**
  - Mitigation: standardized outbound click tagging and producer-side reconciliation imports.
- **Operational Risk: Notification failures reduce trust.**
  - Mitigation: delivery monitoring, retries, and fallback channel routing.
- **Operational Risk: Moderation queue backlog.**
  - Mitigation: severity-based queue, templated actions, and minimum SLA monitoring.

## 8. MVP Cutline

### Must-have (MVP)
- Display name + bio in audience profiles.
- Review visibility upgrades (sorting + rating prominence).
- Recently listed and recently reviewed modules.
- Recommendation v1 (city + favorites, cold-start fallback).
- Reminder opt-in with basic scheduling.
- Unified loading/empty/error/retry states on key discovery pages.
- Producer conversion funnel (impression→detail→ticket click) baseline.

### Should-have (Post-MVP near-term)
- Popular this week weighted ranking refinement.
- Follow groups/producers with configurable notification preferences.
- Producer trend summaries and action CTAs.
- Review moderation queue with richer tooling.

### Later
- Advanced recommendation modeling (contextual sequence models).
- Predictive conversion diagnostics for producers.
- Multi-touch attribution with partner ticketing integrations.

## Assumptions
1. StageLink can instrument outbound ticket-click events consistently across show detail experiences.
2. Existing favorites and city-based discovery data are available for recommendation seeding.
3. Notification infrastructure can support at least in-app delivery and one fallback channel (email).

## 9. Execution Plan: What Can Be Delivered Fully

This section answers the practical question: **what can be executed end-to-end now** with clear ownership and done criteria.

### Execution Principle
- Prioritize work that has direct conversion impact, limited external dependencies, and measurable outcomes within 90 days.
- Ship in vertical slices (schema/API/UI/telemetry together) instead of layer-by-layer handoffs.

### Workstreams We Can Execute Fully (End-to-End)

#### Workstream 1: Audience Identity + Review Visibility (Phase A)
**Can be delivered fully:** Yes.

**Includes**
- Profile fields: display name + bio + validation.
- Review sorting (most recent/most helpful/hybrid default).
- Review count + rating prominence on show and profile surfaces.

**Why this is fully executable now**
- Uses existing profile/review foundations.
- No blocking third-party dependency.
- Impact can be measured quickly through review visibility and click behavior.

**Definition of Done**
- Migrations applied.
- APIs and UI components shipped.
- Telemetry events available in analytics.
- QA scenarios pass for create/edit/view/sort/report flows.

#### Workstream 2: Social Discovery Modules (Phase A)
**Can be delivered fully:** Yes.

**Includes**
- Recently listed module.
- Recently reviewed module.
- Popular this week module with weighted ranking + editorial fallback.

**Why this is fully executable now**
- Inputs already exist (shows, favorites/clicks, reviews).
- Modules can be implemented with current card and feed UI patterns.

**Definition of Done**
- Daily refresh/ranking job running.
- Module APIs stable and paginated.
- Home + city surfaces integrated.
- Empty states and fallback logic validated.

#### Workstream 3: Reminder Notifications (Phase B subset)
**Can be delivered fully:** Yes (MVP scope).

**Includes**
- Reminder opt-in from show/favorites.
- Scheduled sends at 24h and 2h.
- In-app notification + email fallback.

**Why this is fully executable now**
- Existing notification and email function patterns are available.
- Scheduling is deterministic and does not require advanced ML.

**Definition of Done**
- Subscription table + delivery logs implemented.
- Reminder jobs running reliably.
- User controls for opt-in/opt-out functional.
- Delivery success/failure telemetry visible.

#### Workstream 4: Producer Funnel Baseline (Phase C foundation)
**Can be delivered fully:** Yes (baseline, not advanced attribution).

**Includes**
- Funnel metrics: impression → detail view → ticket click.
- Filters: show/date range/city.
- Weekly trend cards with simple insights.

**Why this is fully executable now**
- Uses first-party events already in product flow.
- Can avoid external partner-level reconciliation in MVP.

**Definition of Done**
- Event model finalized and documented.
- Aggregation queries power dashboard charts.
- Producers can filter and export baseline insights.
- Metric definitions aligned across product/data.

### Workstreams That Are Partial Now (Need Follow-on)
- Advanced recommendation modeling beyond rules + lightweight scoring.
- Multi-touch attribution requiring external ticketing partner integrations.
- Predictive producer recommendations based on larger historical datasets.

### Recommended Execution Sequence (12-Week)
- **Weeks 1–3:** Workstream 1 (Identity + Reviews).
- **Weeks 3–5:** Workstream 2 (Social Modules).
- **Weeks 5–8:** Workstream 3 (Reminders).
- **Weeks 8–12:** Workstream 4 (Producer Funnel Baseline).

### Team Ownership Model
- **Product:** scope, KPI definitions, release gates.
- **Frontend:** profile/review UX, modules, reminder controls, producer dashboard views.
- **Backend:** APIs, ranking logic, scheduler, notification fanout, analytics endpoints.
- **Data:** event schema, scoring tables, aggregation jobs, KPI dashboards.
- **QA:** scenario coverage, state reliability, regression suite for discovery and notifications.

### Immediate Next 10 Tickets (Execution Ready)
1. Profile schema migration (display_name, bio, constraints).
2. Profile settings form update with validation and save states.
3. Review sorting API/query params + hybrid default ranking.
4. Show details review block redesign (rating + helpfulness metadata).
5. “Recently listed” API + UI module integration.
6. “Recently reviewed” API + UI module integration.
7. “Popular this week” weighted scoring job + API.
8. Reminder subscription model + opt-in UI controls.
9. Reminder scheduler worker (24h/2h) + delivery logs.
10. Producer funnel query endpoint + baseline dashboard cards.

## 10. All Phases Execution Blueprint (Added)

This section covers **all phases** with an execution-ready sequence so teams can move beyond Phase A without re-planning.

### Phase A (Now): Audience Identity & Social Proof

**Build Scope**
- Profile identity updates (display name, bio, validation).
- Review visibility upgrades (aggregate rating, review sorting, moderation basics).
- Social modules (Popular this week, Recently reviewed, Recently listed).

**Release Checklist**
- [ ] Profile edits + profile social proof card live.
- [ ] Review sort options + moderation report flow live.
- [ ] Social modules visible on Home and City discovery pages.
- [ ] Telemetry for review interactions and module CTR enabled.

**Exit Criteria**
- Discovery-to-detail CTR increases versus baseline.
- Review participation rate and review impressions trend up for active shows.

### Phase B (Next): Discovery & Retention

**Build Scope**
- Recommendation v1 using city, favorites, and behavior data.
- Follow + reminder notifications (in-app and email fallback).
- Unified loading/empty/error/retry states across key discovery surfaces.

**Release Checklist**
- [ ] Recommendation service endpoint + ranked feed placements live.
- [ ] Reminder subscriptions and scheduler (24h/2h) live.
- [ ] Follow graph notifications for new shows live.
- [ ] Shared UX reliability components integrated into top discovery pages.

**Exit Criteria**
- Reminder opt-in reaches target and opt-out remains within acceptable threshold.
- 7-day and 30-day return visits improve relative to baseline.
- Error retry success rate improves on unstable paths.

### Phase C (Then): Producer Growth Tools

**Build Scope**
- Producer funnel metrics (impression → detail → ticket click).
- Segment + trend reporting (city, source, new vs returning).
- Outcome-tied dashboard CTAs with attribution.

**Release Checklist**
- [ ] Funnel dashboard with filters and weekly trend view live.
- [ ] Conversion signal cards (reminder uplift, review effect) live.
- [ ] Producer CTA tracking instrumentation live.
- [ ] Producer dashboard onboarding guidance for first-time users live.

**Exit Criteria**
- Weekly active producers using analytics reaches target.
- Producer CTA adoption correlates with conversion movement.
- Producer activation improves for new listing creators.

### Cross-Phase Dependencies (Must Stay Green)
- Event taxonomy and data contracts stable across frontend/backend/data.
- Notification deliverability monitoring and retry policies active.
- Query performance budgets enforced for discovery and dashboard surfaces.
- KPI definitions and dashboards aligned before each phase release gate.

### Practical Delivery Sequence Across All Phases
1. Finish remaining Phase A social modules and moderation polish.
2. Ship Phase B recommendation and reminder pipeline with conservative defaults.
3. Harden reliability states and retention telemetry in the same Phase B window.
4. Launch Phase C funnel analytics baseline, then iterate with advanced insights.

### Program Governance Cadence
- Weekly: product-engineering-data KPI review and blocker triage.
- Bi-weekly: producer feedback interviews tied to dashboard feature usage.
- Monthly: phase gate review against MVP cutline (must-have vs should-have).
