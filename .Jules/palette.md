## 2024-05-22 - Reusable Component Accessibility
**Learning:** Reusable components like `TagInput` often use icon-only buttons for actions (like removing a tag). These are frequently missed during accessibility sweeps because they are small and embedded deep in the UI.
**Action:** When auditing a codebase, grep for `size="icon"` or similar patterns in the `components/ui` or `common` folder first. Fixing one reusable component fixes it everywhere.
