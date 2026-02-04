## 2025-02-18 - Floating Input Accessibility
**Learning:** The custom `FloatingInput` components use `motion.label` for animation but require manual `htmlFor` and `id` association to be accessible. They also lack built-in visual indicators for required fields.
**Action:** When using or creating similar animated input wrappers, always ensure a unique ID is generated and explicitly linked via `htmlFor`, and provide visual cues for required states.

## 2025-02-19 - Instant Feedback for Copy Actions
**Learning:** Users benefit from immediate, localized feedback when copying to clipboard, as toasts can be missed.
**Action:** Use the `CopyButton` component which swaps the icon/text to "Copied!" temporarily, providing stronger confirmation than a toast alone.

## 2025-02-21 - Icon-Only Buttons and Tooltips
**Learning:** Icon-only buttons (like "More Options" or "Share") are visually clean but inaccessible without explicit `aria-label`s. Wrapping them in Tooltips provides both accessibility (via label) and usability (via hover text) for all users.
**Action:** Always pair `size="icon"` buttons with both `aria-label` and a `Tooltip` wrapper to ensure clarity and accessibility.

## 2024-05-24 - Radix Tooltips & Strict Mode
**Learning:** When testing Radix UI Tooltips with Playwright, standard text selectors (e.g., `get_by_text`) can cause "Strict Mode Violations" because the tooltip content is rendered in the DOM (hidden) *and* in a Portal (visible) simultaneously, or rendered duplicate in React Strict Mode.
**Action:** Use specific locators like `page.locator("div[role='tooltip']").filter(has_text="...")` or ensure you check for visibility explicitly, but be aware that `is_visible()` throws on duplicates. Use `.first` if purely verifying existence, or fix the test harness to not render double.

## 2024-05-24 - Interactive User Identity
**Learning:** In social feeds, users expect avatars and names to be clickable links to profiles. Static text breaks this mental model.
**Action:** Always wrap user identity elements (Avatar, Name) in `Link` components pointing to their profile or group page.
