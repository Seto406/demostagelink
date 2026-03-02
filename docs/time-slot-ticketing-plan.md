# Time Slot Ticketing with Seat Limits (Smooth Rollout Plan)

## Product Goal
Enable producers to run a single show across multiple time slots, with independent seat limits per slot, while users can pick a slot and buy tickets against live remaining capacity.

## Recommended UX Flow

### User flow
1. User opens a show page.
2. If the show has one active slot, preselect it and show remaining seats.
3. If the show has multiple active slots, require slot selection before checkout.
4. Show real-time seat status per slot:
   - `Available` when seats remain.
   - `Low seats` at a configurable threshold (for example <= 10).
   - `Sold out` at 0.
5. At checkout submit, revalidate inventory and place a short seat hold.
6. On payment success, convert hold to sold seats.
7. On timeout/failure/cancel, release the hold.

### Producer flow
1. Producer creates one or more slots under a show.
2. Producer sets a seat limit per slot.
3. Producer can edit seat limit and slot times.
4. Guardrail: do not allow new seat limit below sold seats.
5. Optional: allow increasing limits at any time.

## Business Rules
- Slot selection is required only when multiple active slots exist.
- A ticket always belongs to exactly one slot.
- Seats left = `seat_limit - sold_count - active_hold_count`.
- Inventory checks must happen server-side at hold creation and final purchase.

## Data Model (Minimum)

### `show_slots`
- `id` (uuid)
- `show_id` (uuid, fk)
- `starts_at` (timestamp)
- `ends_at` (timestamp, nullable)
- `seat_limit` (int, > 0)
- `is_active` (bool)
- `created_at`, `updated_at`

### `ticket_inventory_holds`
- `id` (uuid)
- `slot_id` (uuid, fk)
- `user_id` (uuid)
- `quantity` (int, > 0)
- `status` (`active|converted|released|expired`)
- `expires_at` (timestamp)
- `created_at`, `updated_at`

### `tickets`
- include `slot_id` foreign key
- ensure paid tickets decrement slot availability

## API Shape (Suggested)
- `GET /shows/:showId/slots` → list slots + live availability summary.
- `POST /shows/:showId/slots` → create slot (producer only).
- `PATCH /slots/:slotId` → edit slot time/limit/active status (producer only).
- `POST /slots/:slotId/holds` → create temporary hold.
- `DELETE /holds/:holdId` → release hold.
- `POST /checkout/confirm` → finalize purchase + convert hold.

## Live Update Strategy
Recommended in phases:
1. **Phase 1 (fastest, low risk):** polling every 10–15 seconds on show page.
2. **Phase 2:** realtime events (WebSocket/Supabase realtime) to push updates instantly.

This staged rollout keeps implementation stable while giving users near-live accuracy immediately.

## Concurrency & Oversell Prevention
- Use database transaction with row-level lock (`SELECT ... FOR UPDATE`) on slot row when creating holds and confirming checkout.
- Recompute seats left inside transaction.
- Reject hold/checkout when requested quantity exceeds seats left.
- Add background job to expire stale holds.

## Producer Edit Safety Rules
- Allow increasing `seat_limit` freely.
- Allow decreasing only if `new_limit >= sold_count`.
- If there are active holds above the proposed new limit, block update with clear error.

## Rollout Plan (Smoothest Option)
1. Ship producer slot management + seat limits.
2. Ship user slot picker + polling-based live seats.
3. Ship hold-and-confirm checkout protection.
4. Add realtime push updates.
5. Add analytics (slot fill rate, conversion per slot).

## Acceptance Criteria
- Producers can create multiple slots per show.
- Producers can edit seat limits safely.
- Users can choose slot and purchase against that slot.
- Users see current seats left per slot.
- Sold-out slots cannot be purchased.
- No overselling under concurrent checkout attempts.

## One-Paragraph External Description
"We now support time-slot ticketing: producers can create multiple showtimes and set seat limits for each one, while customers pick their preferred slot and see live remaining seats before checkout. Inventory is protected with server-side holds and final checkout validation to prevent overselling."
