import { Step } from "react-joyride";

interface BasicVsPremiumProps {
  featureName: string;
  basicPoints: string[];
  premiumPoints: string[];
  basicVisibility?: string;
  premiumVisibility?: string;
}

// Helper for "Basic vs Premium" content
const BasicVsPremiumContent = ({
  featureName,
  basicPoints,
  premiumPoints,
  basicVisibility = "Organic reach",
  premiumVisibility = "Expanded beyond followers + prioritized exposure",
}: BasicVsPremiumProps) => (
  <div className="space-y-4 text-left">
    <h3 className="font-serif text-lg font-bold text-center border-b pb-2 mb-2">
      {featureName}: Basic vs Premium
    </h3>
    <div className="grid grid-cols-2 gap-4 text-xs">
      <div className="space-y-2">
        <p className="font-bold text-muted-foreground uppercase tracking-wider">Basic (Free)</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          {basicPoints.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] italic opacity-80">Visibility: {basicVisibility}</p>
      </div>
      <div className="space-y-2 border-l pl-4 border-secondary/20">
        <p className="font-bold text-secondary uppercase tracking-wider">Premium (P399/mo)</p>
        <ul className="list-disc list-inside space-y-1 text-foreground font-medium">
          {premiumPoints.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] text-secondary font-bold">Visibility: {premiumVisibility}</p>
      </div>
    </div>
  </div>
);

interface MutualBenefitProps {
  title: string;
  benefits: string[];
  summary: string;
}

const MutualBenefitContent = ({
  title,
  benefits,
  summary,
}: MutualBenefitProps) => (
  <div className="text-center space-y-3">
    <h3 className="font-serif text-lg font-bold text-secondary">{title}</h3>
    <ul className="space-y-2 text-sm text-left mx-auto max-w-[80%]">
      {benefits.map((benefit, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-green-500 font-bold">✔</span>
          <span>{benefit}</span>
        </li>
      ))}
    </ul>
    <p className="text-sm italic mt-4 border-t pt-2 border-secondary/20">{summary}</p>
  </div>
);

export const getTourSteps = (isProducer: boolean): Step[] => [
  // --- HOMEPAGE (Steps 0-5) ---
  {
    target: "body",
    placement: "center",
    title: "Central Exposure Hub",
    content: (
      <div>
        The Homepage is designed to increase visibility for productions and theatre groups.
        <br />
        <strong>Producers share updates.</strong>
        <br />
        <strong>Audiences discover them instantly.</strong>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[data-tour="feed-post"]', // Target a feed post
    title: "Highlight Features 1: Producer Updates",
    content: (
      <div>
        When producers post updates, they automatically appear in followers’ feeds.
        No need for external promotion — the platform ensures your production is visible.
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> More reach. More awareness. More engagement.
        </div>
      </div>
    ),
  },
  {
    target: '[data-tour="feed-interaction"]', // Target interaction buttons (like/comment)
    title: "Highlight Features 2: Audience Engagement",
    content: (
      <div>
        When audiences react, posts gain more visibility.
        Active productions stay highlighted, helping more people discover them.
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Interaction becomes promotion.
        </div>
      </div>
    ),
  },
  {
    target: '[data-tour="sidebar-suggestions"]', // Target Sidebar
    title: "Highlight Features 3: Suggested Groups Section",
    content: (
      <div>
        The homepage recommends theatre groups to users.
        This gives both new and established groups a chance to be discovered.
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Visibility is not limited to followers.
        </div>
      </div>
    ),
  },
  {
    target: "body",
    placement: "center",
    title: "Homepage: Basic vs Premium",
    content: (
      <BasicVsPremiumContent
        featureName="Feed Visibility"
        basicPoints={[
          "Posts appear only to followers",
          "Feed ranking is chronological (no boost)",
          "Group appears occasionally in Suggested Groups (random rotation)",
          "Standard post format"
        ]}
        premiumPoints={[
          "Posts appear to followers and interested users",
          "Higher feed ranking (appears above standard posts)",
          "Guaranteed placement in Suggested Groups banner (pinned)",
          "Highlighted post design (badge)"
        ]}
      />
    ),
  },
  {
    target: "body",
    placement: "center",
    title: "Mutual Benefit",
    content: (
      <MutualBenefitContent
        title="Built for Producers and Audiences"
        benefits={[
          "Producers gain automatic exposure",
          "Audiences discover shows effortlessly",
          "Engagement strengthens community reach"
        ]}
        summary="The homepage turns updates into sustained visibility."
      />
    ),
  },

  // --- SHOWS (Steps 6-10) ---
  {
    target: "body",
    placement: "center",
    title: "Explore Productions",
    content: (
      <div>
        The Shows Page is designed to help audiences discover productions and for producers to gain exposure.
        <br />
        <strong>Search, filter, and interact — all in one place.</strong>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[data-tour="shows-search"]', // Search bar
    title: "Highlight Features 1: Search & Filters",
    content: (
      <div>
        Quickly find productions using:
        <ul className="list-disc list-inside mt-1 text-sm">
          <li>Production title</li>
          <li>City / Location</li>
          <li>Type / Genre</li>
          <li>Date</li>
        </ul>
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Producers are discoverable by the right audiences.
        </div>
      </div>
    ),
  },
  {
    target: '[data-tour="shows-tabs"]', // Tabs
    title: "Highlight Features 2: Sort by Status",
    content: (
      <div>
        Shows are categorized as:
        <ul className="list-disc list-inside mt-1 text-sm">
          <li><strong>Upcoming</strong> — audiences can comment</li>
          <li><strong>Ongoing</strong> — audiences can review and rate</li>
          <li><strong>Completed</strong> — audiences can review and rate</li>
        </ul>
        Producers can moderate comments to remove hate speech or unrelated content.
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Engagement enhances promotion while keeping content safe.
        </div>
      </div>
    ),
  },
  {
    target: "body",
    placement: "center",
    title: "Shows: Basic vs Premium",
    content: (
      <BasicVsPremiumContent
        featureName="Search & Discovery"
        basicPoints={[
          "Search & filter by title, city, type, date",
          "Sort shows by Upcoming, Ongoing, Completed",
          "Comment on Upcoming; review & rate Completed"
        ]}
        premiumPoints={[
          "Priority search & targeted filters",
          "Sort shows with highlighted posts",
          "Comment, review & rate with boosted visibility",
          "Producers can moderate comments"
        ]}
        premiumVisibility="Extended reach + prioritized exposure"
      />
    ),
  },
  {
    target: "body",
    placement: "center",
    title: "Mutual Benefit",
    content: (
      <MutualBenefitContent
        title="Built for Producers and Audiences"
        benefits={[
          "Audiences find shows they care about",
          "Producers reach new viewers",
          "Engagement strengthens community discovery"
        ]}
        summary="The Shows Page turns browsing into visibility and opportunity."
      />
    ),
  },

  // --- DIRECTORY (Steps 11-16) ---
  {
    target: "body",
    placement: "center",
    title: "Explore Groups",
    content: (
      <div>
        The Directory Page helps audiences discover theatre groups without needing to know their names.
        <br />
        <strong>Sort, filter, and connect — all in one place.</strong>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[data-tour="directory-filters"]', // Filters
    title: "Highlight Features 1: Sort by Type + Location",
    content: (
      <div>
        Quickly find theatre groups using:
        <ul className="list-disc list-inside mt-1 text-sm">
          <li>Local / Community groups</li>
          <li>University-based groups</li>
        </ul>
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Groups are discoverable even if audiences don’t know them beforehand.
        </div>
      </div>
    ),
  },
  // Only show Join Request step to Non-Producers
  ...(!isProducer ? [
    {
      target: '[data-tour="directory-join-btn"]', // Join button on card
      title: "Highlight Features 2: Request to Join",
      content: (
        <div>
          Audience members can request to join a theatre group account via the Join as a Member button:
          <ul className="list-disc list-inside mt-1 text-sm">
            <li>Sends a notification to the group for approval</li>
            <li>Enables performers or members to connect directly</li>
          </ul>
          <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
            <strong>Visibility Impact:</strong> Groups receive qualified requests, and audiences can join without searching externally.
          </div>
        </div>
      ),
    }
  ] : []),
  {
    target: "body", // Collab button isn't on directory page itself usually, so body fallback with context
    placement: "center",
    title: isProducer ? "Highlight Features 2: Collaboration Button" : "Highlight Features 3: Collaboration Button",
    content: (
      <div>
        Producers can tap the Collab button (on a group's profile) to connect with other producers.
        <ul className="list-disc list-inside mt-1 text-sm">
          <li>The other producer receives an email notification with contact details.</li>
          <li>Opens opportunities for partnerships and joint productions.</li>
        </ul>
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Collaboration extends reach for both producers and audiences.
        </div>
      </div>
    ),
  },
  {
    target: "body",
    placement: "center",
    title: "Directory: Basic vs Premium",
    content: (
      <BasicVsPremiumContent
        featureName="Group Visibility"
        basicPoints={[
          "Browse all theatre groups",
          "Sort by Local or University",
          "View basic group info",
          "Audience can request to join (limited to 10/month)"
        ]}
        premiumPoints={[
          "Groups appear at the top of Directory listings (unlimited visibility)",
          "Audience can request to join (unlimited)",
          "Collab button with highlighted notifications",
          "Group profiles include extended media & stats"
        ]}
        premiumVisibility="Extended reach + prioritized exposure"
      />
    ),
  },
  {
    target: "body",
    placement: "center",
    title: "Mutual Benefit",
    content: (
      <MutualBenefitContent
        title="Built for Groups and Audiences"
        benefits={[
          "Audiences discover groups effortlessly",
          "Groups gain exposure to their members individually",
          "Engagement strengthens community connections"
        ]}
        summary="The Directory Page turns browsing into visibility and recruitment opportunities."
      />
    ),
  },

  // --- DASHBOARD (Steps 17-19) ---
  ...(isProducer ? [
    {
      target: "body",
      placement: "center" as const, // explicitly cast literal type if needed by joyride types
      title: "Your Command Center",
      content: (
        <div>
          The Dashboard gives producers a complete view of their productions and audience engagement.
          <br />
          <strong>Track your reach, manage submissions, and gain insights — all in one place.</strong>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '[data-tour="dashboard-analytics"]',
      title: "Highlight Features: Analytics",
      content: (
        <BasicVsPremiumContent
          featureName="Analytics"
          basicPoints={[
            "Total Productions submitted",
            "Approved Productions",
            "Productions Under Review"
          ]}
          basicVisibility="Track status of submissions"
          premiumPoints={[
            "Total Profile Views",
            "Total Ticket Clicks",
            "Click-through Rate (CTR)",
            "External Engagement Tracker"
          ]}
          premiumVisibility="See audience engagement and attract interest"
        />
      ),
    },
    {
      target: "body",
      placement: "center" as const,
      title: "Benefit",
      content: (
        <MutualBenefitContent
          title="Built for Producers"
          benefits={[
            "Producers gain actionable insights to grow visibility",
            "Analytics turn data into strategy for successful productions"
          ]}
          summary=""
        />
      ),
    },
  ] : []),

  // --- GROUP PROFILE (Steps 20-28) (Offset index depends on isProducer) ---
  {
    target: '[data-tour="profile-header"]',
    placement: "bottom",
    title: "Explore Theatre Groups",
    content: (
      <div>
        The Group Profile Page lets audiences and performers see everything about a theatre group in one place.
        <br />
        <strong>Learn about their productions, members, and activities.</strong>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile-header"]',
    title: "Highlight Features 1: Group Info",
    content: (
      <div>
        <ul className="list-disc list-inside mt-1 text-sm">
          <li>Logo, cover photo, and description</li>
          <li>Type of group: Local/Community or University-based</li>
          <li>Contact info for inquiries</li>
        </ul>
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Audiences immediately know what the group does and how to connect.
        </div>
      </div>
    ),
  },
  {
    target: '[data-tour="profile-location"]',
    title: "Highlight Features 2: Location Discovery",
    content: (
      <div>
        <ul className="list-disc list-inside mt-1 text-sm">
          <li>See where the group is based through embedded maps</li>
          <li>Filter groups by city or area</li>
        </ul>
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Audiences can find nearby shows and groups easily.
        </div>
      </div>
    ),
  },
  {
    target: '[data-tour="profile-ensemble"]',
    title: "Highlight Features 3: Linked Members Account",
    content: (
      <div>
        <ul className="list-disc list-inside mt-1 text-sm">
          <li>Shows group members with linked profiles</li>
          <li>Members’ roles and participation in productions</li>
        </ul>
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Audiences and producers see who’s involved and can connect directly.
        </div>
      </div>
    ),
  },
  {
    target: '[data-tour="profile-follow"]', // Follow button
    title: "Highlight Features 4: Notifications & Calendar",
    content: (
      <div>
        <ul className="list-disc list-inside mt-1 text-sm">
          <li>Followed shows send notifications for updates</li>
          <li>Add shows directly to personal calendar</li>
        </ul>
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Audiences never miss shows, increasing engagement and attendance.
        </div>
      </div>
    ),
  },
  {
    target: '[data-tour="profile-show-card"]', // Show card (for Seat Commitment mention)
    title: "Highlight Features 5: Seat Commitment",
    content: (
      <div>
        For ticketed shows, audiences can commit/reserve seats.
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Helps producers track expected attendance and plan better.
        </div>
      </div>
    ),
  },
  {
    target: '[data-tour="profile-ticket-btn"]', // Ticket button
    title: "Highlight Features 6: External Ticket Link",
    content: (
      <div>
        Link to producer’s external ticket sales page.
        <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20 text-xs">
          <strong>Visibility Impact:</strong> Makes it easy for audiences to buy tickets, improving both visibility and revenue.
        </div>
      </div>
    ),
  },
  {
    target: "body",
    placement: "center",
    title: "Group Profile: Basic vs Premium",
    content: (
      <BasicVsPremiumContent
        featureName="Show Listings & Engagement"
        basicPoints={[
          "Up to 2 show listings per month",
          "No Seat Commitment for free shows",
          "No External Ticket Link",
          "Limited Linked Members Profile (10 only)"
        ]}
        premiumPoints={[
          "Unlimited show listings",
          "Seat Commitment enabled",
          "External Ticket Integration",
          "Unlimited Linked Members Profile"
        ]}
        premiumVisibility="Extended reach + prioritized exposure"
      />
    ),
  },
  {
    target: "body",
    placement: "center",
    title: "Mutual Benefit",
    content: (
      <MutualBenefitContent
        title="Built for Producers and Audiences"
        benefits={[
          "Groups share full details and reach audiences effectively",
          "Producers link their tickets and gain exposure",
          "Audiences discover shows, track updates, and commit attendance"
        ]}
        summary=""
      />
    ),
  },
];
