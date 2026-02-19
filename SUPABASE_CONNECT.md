# Supabase Connection Verification

Verified on: 2026-02-19

## Status
- **Connection**: Successful
- **Project URL**: `https://dssbduklgbmxezpjpuen.supabase.co`
- **Active Project ID**: `dssbduklgbmxezpjpuen` (from `.env`)
- **Verified Table**: `profiles`
- **Result**: Data accessible (row count: 19)

## Configuration Status
- The `.env` file uses project ID `dssbduklgbmxezpjpuen`.
- The `supabase/config.toml` file also uses project ID `dssbduklgbmxezpjpuen`.
- Configuration is consistent across environment and Supabase config.

## Retrieving the Service Role Key for MCP
To fully connect the Supabase MCP tool (which requires admin access), you need the **Service Role Key** (secret) corresponding to the active project (`dssbduklgbmxezpjpuen`).

**Steps to retrieve the Service Role Key:**
1.  Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select the project with ID: `dssbduklgbmxezpjpuen`.
3.  Go to **Settings** (gear icon) > **API**.
4.  Look for the **Project API keys** section.
5.  Find the `service_role` key (starts with `ey...`). Click "Reveal" and copy it.
6.  **Do not commit this key to the repository.** Use it directly in your MCP configuration or as a secret environment variable (`SUPABASE_SERVICE_ROLE_KEY`) if supported.

The **Project URL** to use is: `https://dssbduklgbmxezpjpuen.supabase.co`
