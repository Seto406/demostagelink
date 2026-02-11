# Authentication & Deliverability Audit Report
Date: 2026-02-11

This report summarizes the findings from the recent audit of the StageLink authentication and email delivery system, along with recommended actions.

## 1. SMTP Configuration Status

*   **Host**: smtp.resend.com (verified and active).
*   **Port**: Currently set to **465** (SSL).
*   **Recommendation**: Change the port to **587** (TLS).
    *   **Reason**: Some cloud environments handle port 587 more reliably for SMTP handshakes. This is a common fix for "Sign up failed" errors related to connection timeouts or SSL handshake failures.

## 2. Sender Identity & Domain Health

*   **Verified Domain**: `stagelink.show` (Verified in Resend).
*   **Verified Sender**: `noreply@stagelink.show` (Set as "Source email" in Supabase Auth).
*   **Sender Name Mismatch**:
    *   Supabase Auth uses "StageLink" as the sender name.
    *   Edge Functions (e.g., `send-welcome-email`, `notify-new-show`) use "StageLink <hello@stagelink.show>".
    *   **Recommendation**: Ensure the "Sender Name" in Supabase (currently "StageLink") does not conflict with DMARC policies. Ideally, align all sender identities to use the same verified domain and format if possible, or ensure both `noreply@` and `hello@` are fully authenticated.

## 3. Template Syntax Audit

*   **File Checked**: `supabase/email_templates/confirm_signup.html`
*   **Variable Integrity**:
    *   `{{ .ConfirmationURL }}` and `{{ .SiteURL }}` are used correctly.
    *   **Verification**: A script was run to detect invisible characters. **No zero-width spaces or hidden characters were found** in the repository's template file around these variables.
*   **Action Required**:
    *   If the template in the Supabase Dashboard was manually pasted, please re-paste the content from `supabase/email_templates/confirm_signup.html` to ensure no hidden characters were introduced during copy-paste from other sources.

## 4. Error Handling & debugging

*   **Client-Side**:
    *   `AuthContext.tsx` has been updated to log full error objects to the console.
    *   `AuthForm.tsx` has been updated to display error status codes (if available) in the toast notification.
    *   **Action**: If a user reports "Sign up failed", ask them for the specific error message and status code displayed in the toast, or check the browser console for the full error object.

## 5. Next Steps for Administrator

1.  **Supabase Dashboard**: Go to Authentication -> SMTP Settings.
2.  **Change Port**: Update the SMTP port from 465 to **587**.
3.  **Save & Test**: Attempt a signup with a test email to verify the fix.
4.  **Monitor**: Check Supabase Auth Audit Logs for any "535 Authentication Failed" errors if the issue persists.
