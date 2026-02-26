# Deployment Guide

This project is configured to be deployed on [Render](https://render.com) as a Static Site, using the `render.yaml` Blueprint configuration.

## Automatic Deployment

To enable automatic deployment whenever you push to your Git repository:

1.  **Sign up/Log in to Render**: Go to [dashboard.render.com](https://dashboard.render.com).
2.  **Create a New Blueprint Instance**:
    *   Click on **New +** button in the dashboard.
    *   Select **Blueprint**.
    *   Connect your GitHub/GitLab repository.
    *   Render will automatically detect the `render.yaml` file in the root of your project.
3.  **Apply the Blueprint**:
    *   Render will show you the resources defined in `render.yaml` (a Static Site named `vite-react-shadcn-ts`).
    *   Click **Apply**.

Once set up, Render will automatically build and deploy your site every time you push changes to the main branch.

## Manual Configuration (If not using Blueprint)

If you prefer to configure it manually as a **Static Site**:

1.  **Build Command**: `pnpm install && pnpm run build`
2.  **Publish Directory**: `dist`
3.  **Environment Variables**:
    *   `VITE_SUPABASE_URL`: Your Supabase URL.
    *   `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase Anon Key.
    *   `VITE_SENTRY_DSN`: (Optional) Sentry DSN for error tracking.
    *   `VITE_ADMIN_ACTION_KEY`: (Optional) Admin key if used.
4.  **Rewrite Rules**:
    *   **Source**: `/*`
    *   **Destination**: `/index.html`
    *   This is required for Single Page Applications (SPA) to handle client-side routing.

## Troubleshooting

*   **Build Failures**: Check the logs on Render. Ensure `pnpm-lock.yaml` is up to date.
*   **Env Vars**: Ensure all required environment variables are set in the Render dashboard if they are not picked up automatically (Blueprint sets `sync: false` for sensitive keys, so you might need to enter them manually in the Render Dashboard).
