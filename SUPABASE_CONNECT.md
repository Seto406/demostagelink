# Connecting Jules to Supabase

To enable Jules to interact with your Supabase database, you need to provide the correct credentials. Jules requires the **Project URL** and the **Service Role Key** (not the Anon/Public key) to perform administrative actions.

## 1. Get Your Credentials

1.  Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project (`jfttjnoxveekouqcznis`).
3.  Go to **Project Settings** (gear icon at the bottom left).
4.  Select **API** from the side menu.
5.  Find the **Project URL** and copy it.
6.  Scroll down to the **Project API keys** section.
7.  Find the `service_role` key (it might be hidden, click "Reveal"). **Copy this key.**
    *   **⚠️ IMPORTANT:** Do not use the `anon` / `public` key. Jules needs the `service_role` key to bypass Row Level Security (RLS) policies for administrative tasks.

## 2. Configure Integration

1.  Open the **Integrations** or **Settings** panel in your current environment (where you are chatting with Jules).
2.  Locate the **Supabase** integration.
3.  Enter the **Project URL** and **Service Role Key** you copied.
4.  Save the settings.

## 3. Verify Connection

Once configured, Jules should be able to access your database tables and run queries. You can ask Jules to "list all users" or "show me the schema" to test the connection.
