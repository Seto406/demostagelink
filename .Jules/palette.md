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

## 2025-05-15 - Tooltips on Icon Buttons
**Learning:** Icon-only buttons (Settings, Notifications, Favorites) in the Navbar were inaccessible and ambiguous. Adding Tooltips resolved this, but verifying authenticated states via Playwright proved difficult due to Supabase Auth mocking complexities.
**Action:** Consistently apply Tooltips to all icon-only buttons. For verification, if auth mocking is flaky, rely on unauthenticated state checks and code review/build validation.

## 2025-02-13 - Conditional Tooltips & Playwright Timing
**Learning:** Testing Radix UI tooltips with Playwright requires explicit waits for animation delays (default 300ms) or they fail `toBeVisible` checks. Also, wrapping conditional tooltips in a helper component keeps JSX clean.
**Action:** Use `await page.waitForTimeout(500)` after hover when testing animated tooltips, and extract conditional tooltip logic into reusable components.

## 2025-05-24 - Playwright Tooltip Verification
**Learning:** When verifying tooltips with Playwright, avoid using `get_by_text` for the tooltip content if the same text exists elsewhere. Use `page.get_by_role('tooltip')` to target the active tooltip content specifically to avoid strict mode violations.
**Action:** Use `page.get_by_role('tooltip')` combined with `.to_have_text()` for robust tooltip verification.

## 2025-05-25 - Dynamic Tooltip Content for Toggles
**Learning:** Toggle buttons (like hamburger menus) require dynamic tooltip text to accurately reflect the action, unlike static links. Providing "Open" vs "Close" context improves clarity.
**Action:** Use state variables in `TooltipContent` to switch labels based on component state (e.g., `isOpen ? "Close Menu" : "Open Menu"`).
