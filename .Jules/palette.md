## 2025-02-18 - Floating Input Accessibility
**Learning:** The custom `FloatingInput` components use `motion.label` for animation but require manual `htmlFor` and `id` association to be accessible. They also lack built-in visual indicators for required fields.
**Action:** When using or creating similar animated input wrappers, always ensure a unique ID is generated and explicitly linked via `htmlFor`, and provide visual cues for required states.

## 2025-02-19 - Instant Feedback for Copy Actions
**Learning:** Users benefit from immediate, localized feedback when copying to clipboard, as toasts can be missed.
**Action:** Use the `CopyButton` component which swaps the icon/text to "Copied!" temporarily, providing stronger confirmation than a toast alone.
