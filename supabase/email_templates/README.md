# Supabase Email Templates

This directory contains HTML email templates for StageLink authentication emails.

## Prerequisites

1.  **Images**: The templates rely on background images stored in `public/email/`.
    -   `bg_curtains.png` (Default, theatrical style)
    -   `bg_clean.png` (Alternative, cleaner style)

    Ensure these files are deployed to your public site so they are accessible via `https://www.stagelink.show/email/bg_curtains.png` (or your configured `Site URL`).

2.  **User Metadata**: The templates use `{{ .Data.first_name }}` to personalize the greeting. Ensure your user metadata contains a `first_name` field.
    -   If `first_name` is missing, it will render as empty (e.g., "Hi ,").
    -   The "Invite User" template also uses `{{ .Data.inviter_name }}`.

## How to Apply

1.  Go to your **Supabase Dashboard**.
2.  Navigate to **Authentication** > **Email Templates**.
3.  Select the template you want to update (e.g., "Confirm Signup").
4.  Copy the content of the corresponding `.html` file from this directory.
5.  Paste it into the **Message Body** editor in Supabase.
6.  **Subject Line**: Update the subject line in Supabase to match the file header or the list below:

    -   **Confirm Signup**: `Welcome to StageLink, {{ .Data.first_name }}!`
    -   **Invite User**: `{{ .Data.first_name }}, you’ve been invited to StageLink`
    -   **Magic Link**: `Log in to StageLink, {{ .Data.first_name }}`
    -   **Change Email**: `Confirm your new email, {{ .Data.first_name }}`
    -   **Reset Password**: `Reset your StageLink password, {{ .Data.first_name }}`

## Files

-   `confirm_signup.html`: Verification email for new signups.
-   `invite_user.html`: Email sent when inviting a user (via Admin API).
-   `magic_link.html`: Passwordless login email.
-   `change_email.html`: Confirmation for email address updates.
-   `reset_password.html`: Password reset email.
