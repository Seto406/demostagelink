# AdSense and Sponsorship Guide

This guide explains how to configure advertisements on StageLink using the updated `AdBanner` component.

## 1. Google AdSense Integration

To display Google Ads on your website, follow these steps:

### Step 1: Sign up for AdSense
1.  Go to [Google AdSense](https://adsense.google.com/).
2.  Sign up with your Google account.
3.  Add your site (`https://www.stagelink.show`) to AdSense.

### Step 2: Get your Publisher ID and Script
1.  In AdSense, go to **Ads > Overview**.
2.  Click **Get Code**.
3.  Copy the script snippet. It looks like this:
    ```html
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
    ```
4.  Open `index.html` in your project.
5.  Uncomment the AdSense script section in the `<head>` and replace `ca-pub-YOUR_PUBLISHER_ID` with your actual ID.

### Step 3: Create Ad Units
1.  In AdSense, go to **Ads > By ad unit**.
2.  Create a new **Display ad**.
3.  Name it (e.g., "Feed Horizontal" or "Sidebar Box").
4.  Select **Responsive** or **Fixed** size.
5.  Click **Create** and get the code. You will need two values:
    -   `data-ad-client` (e.g., `ca-pub-1234567890123456`)
    -   `data-ad-slot` (e.g., `1234567890`)

### Step 4: Update the Code
Use the `AdBanner` component in your pages (e.g., `src/pages/UserFeed.tsx`) with the `adsense` variant.

```tsx
<AdBanner
  format="horizontal"
  variant="adsense"
  adClient="ca-pub-XXXXXXXXXXXXXXXX"
  adSlot="1234567890"
/>
```

## 2. Sponsorships (Custom Ads)

If you have direct sponsors, you can display their banner and link directly without using AdSense.

### Usage
Use the `AdBanner` component with the `sponsorship` variant.

```tsx
<AdBanner
  format="box"
  variant="sponsorship"
  sponsorName="TicketWorld"
  sponsorImage="https://example.com/banner.jpg"
  sponsorLink="https://ticketworld.com.ph"
/>
```

-   `sponsorImage`: URL to the banner image.
-   `sponsorLink`: URL where the user will be redirected.
-   `sponsorName`: Alt text for the image or text displayed if image fails.

## 3. Placeholder (Default)

If no variant is specified, it defaults to the placeholder "Advertisement" box.

```tsx
<AdBanner format="box" />
```

This is useful for layout testing or when you don't have an active ad campaign.
