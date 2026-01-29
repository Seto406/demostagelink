## 2024-05-23 - Floating Input Accessibility Pattern
**Learning:** The custom `FloatingInput` and `FloatingTextarea` components were missing `htmlFor` associations and required field indicators. This is a common pattern in custom UI libraries where accessibility is overlooked for aesthetics.
**Action:** Enforce a pattern where all form field wrappers use `React.useId()` to generate fallback IDs and automatically render a required indicator (e.g., red asterisk) when the `required` prop is present. This ensures accessibility and UX consistency without manual effort from consumers.
