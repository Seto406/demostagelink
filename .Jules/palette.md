## 2025-02-18 - Floating Input Accessibility
**Learning:** The custom `FloatingInput` components use `motion.label` for animation but require manual `htmlFor` and `id` association to be accessible. They also lack built-in visual indicators for required fields.
**Action:** When using or creating similar animated input wrappers, always ensure a unique ID is generated and explicitly linked via `htmlFor`, and provide visual cues for required states.
