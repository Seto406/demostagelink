# Supabase Email Templates

This directory contains HTML email templates for StageLink authentication emails.

## Prerequisites

1.  **Images**: The templates rely on background images stored in `public/email/`.
    -   `bg_curtains.png` (Default, theatrical style)
    -   `bg_clean.png` (Alternative, cleaner style)

    Ensure these files are deployed to your public site so they are accessible via `https://www.stagelink.show/email/bg_curtains.png` (or your configured `Site URL`).

2.  **User Metadata**: The templates use `{{ .Data.first_name }}` to personalize the greeting.
    -   **Important**: The application must collect `first_name` in the user's metadata (e.g., during signup or via Google OAuth).
    -   The templates include conditional logic (e.g., `{{ if .Data.first_name }}...{{ end }}`) to gracefully handle cases where the name is missing (e.g., "Hi," vs "Hi John,").
    -   The "Invite User" template also uses `{{ .Data.inviter_name }}`.

## How to Apply

1.  Go to your **Supabase Dashboard**.
2.  Navigate to **Authentication** > **Email Templates**.
3.  Select the template you want to update (e.g., "Confirm Signup").
4.  Copy the content of the corresponding `.html` file from this directory.
5.  Paste it into the **Message Body** editor in Supabase.
6.  **Subject Line**: Update the subject line in Supabase to match the file header or the list below. You can copy these patterns exactly as Supabase supports the same templating syntax in subjects:

    -   **Confirm Signup**: `Welcome to StageLink{{ if .Data.first_name }}, {{ .Data.first_name }}{{ end }}!`
    -   **Invite User**: `{{ if .Data.first_name }}{{ .Data.first_name }}, you’ve{{ else }}You’ve{{ end }} been invited to StageLink`
    -   **Magic Link**: `Log in to StageLink{{ if .Data.first_name }}, {{ .Data.first_name }}{{ end }}`
    -   **Change Email**: `Confirm your new email{{ if .Data.first_name }}, {{ .Data.first_name }}{{ end }}`
    -   **Reset Password**: `Reset your StageLink password{{ if .Data.first_name }}, {{ .Data.first_name }}{{ end }}`

## Files

-   `confirm_signup.html`: Verification email for new signups.
-   `invite_user.html`: Email sent when inviting a user (via Admin API).
-   `magic_link.html`: Passwordless login email.
-   `change_email.html`: Confirmation for email address updates.
-   `reset_password.html`: Password reset email.
