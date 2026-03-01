const SCENARIO_EMAIL_MAP = {
  delivered: "delivered@resend.dev",
  bounced: "bounced@resend.dev",
  complained: "complained@resend.dev",
  suppressed: "suppressed@resend.dev",
} as const;

type SmokeScenario = keyof typeof SCENARIO_EMAIL_MAP;
type SmokeTestTarget = "collab" | "notification" | "both";

type TestResult = {
  attempted: boolean;
  success: boolean;
  status: number;
  id: string | null;
  error: string | null;
};

const MAX_ERROR_CHARS = 2000;
const DEFAULT_FROM_EMAIL = "StageLink <hello@stagelink.show>";

const truncateError = (value: string): string => {
  if (value.length <= MAX_ERROR_CHARS) return value;
  return `${value.slice(0, MAX_ERROR_CHARS)}...`;
};

const getJsonBody = (body: unknown): Record<string, unknown> => {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof body === "object") {
    return body as Record<string, unknown>;
  }
  return {};
};

const unauthorized = (res: any) => res.status(401).json({ success: false, error: "Unauthorized" });

const notAttemptedResult = (): TestResult => ({
  attempted: false,
  success: false,
  status: 0,
  id: null,
  error: null,
});

const isScenario = (value: unknown): value is SmokeScenario =>
  typeof value === "string" && Object.hasOwn(SCENARIO_EMAIL_MAP, value);

const isTestTarget = (value: unknown): value is SmokeTestTarget =>
  value === "collab" || value === "notification" || value === "both";

async function sendCollabSmokeEmail(
  resendApiKey: string,
  toEmail: string,
  scenario: SmokeScenario,
): Promise<TestResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
      to: [toEmail],
      subject: `[SmokeTest][collab][${scenario}]`,
      html: `<p>StageLink collab smoke test for <strong>${scenario}</strong>.</p>`,
    }),
  });

  const textBody = await response.text();
  let parsedBody: { id?: string } | null = null;
  try {
    parsedBody = textBody ? (JSON.parse(textBody) as { id?: string }) : null;
  } catch {
    parsedBody = null;
  }

  if (!response.ok) {
    return {
      attempted: true,
      success: false,
      status: response.status,
      id: null,
      error: truncateError(textBody || "Resend request failed"),
    };
  }

  return {
    attempted: true,
    success: true,
    status: response.status,
    id: parsedBody?.id ?? null,
    error: null,
  };
}

async function sendNotificationSmokeEmail(
  supabaseProjectRef: string,
  smokeTestKey: string,
  toEmail: string,
  scenario: SmokeScenario,
  supabaseAuthToken?: string,
): Promise<TestResult> {
  const functionUrl = `https://${supabaseProjectRef}.functions.supabase.co/send-notification-email`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-smoke-test": "true",
    "x-smoke-test-key": smokeTestKey,
  };

  if (supabaseAuthToken) {
    headers.Authorization = `Bearer ${supabaseAuthToken}`;
    headers.apikey = supabaseAuthToken;
  }

  const response = await fetch(functionUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      recipient_id: "00000000-0000-0000-0000-000000000000",
      type: "membership_application",
      data: {
        applicant_name: "Smoke Test",
        group_name: `Scenario: ${scenario}`,
        link: "https://www.stagelink.show/dashboard",
        test_email: toEmail,
      },
    }),
  });

  const textBody = await response.text();
  let parsedBody: { id?: string } | null = null;
  try {
    parsedBody = textBody ? (JSON.parse(textBody) as { id?: string }) : null;
  } catch {
    parsedBody = null;
  }

  if (!response.ok) {
    return {
      attempted: true,
      success: false,
      status: response.status,
      id: null,
      error: truncateError(textBody || "Notification function request failed"),
    };
  }

  return {
    attempted: true,
    success: true,
    status: response.status,
    id: parsedBody?.id ?? null,
    error: null,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const adminActionKey = process.env.ADMIN_ACTION_KEY;
  const authHeader = req.headers.authorization;

  if (!adminActionKey || !authHeader?.startsWith("Bearer ")) {
    return unauthorized(res);
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || token !== adminActionKey) {
    return unauthorized(res);
  }

  const body = getJsonBody(req.body);
  const scenario = body.scenario;
  const test = body.test;

  if (!isScenario(scenario) || !isTestTarget(test)) {
    return res.status(400).json({
      success: false,
      error: "Invalid payload. Expected { scenario, test }.",
    });
  }

  const targetEmail = SCENARIO_EMAIL_MAP[scenario];
  const resendApiKey = process.env.RESEND_API_KEY;
  const smokeTestKey = process.env.SMOKE_TEST_KEY;
  const supabaseProjectRef = process.env.SUPABASE_PROJECT_REF;
  const supabaseAuthToken = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const collabResult = notAttemptedResult();
  const notificationResult = notAttemptedResult();

  console.info("email-smoke-test requested", { scenario, test, domain: "@resend.dev" });

  if ((test === "collab" || test === "both") && !resendApiKey) {
    collabResult.attempted = true;
    collabResult.status = 500;
    collabResult.error = "Missing RESEND_API_KEY";
  }

  if ((test === "notification" || test === "both") && (!smokeTestKey || !supabaseProjectRef)) {
    notificationResult.attempted = true;
    notificationResult.status = 500;
    notificationResult.error = "Missing SMOKE_TEST_KEY or SUPABASE_PROJECT_REF";
  }

  try {
    if (test === "collab" || test === "both") {
      if (!collabResult.error && resendApiKey) {
        Object.assign(collabResult, await sendCollabSmokeEmail(resendApiKey, targetEmail, scenario));
      } else {
        collabResult.success = false;
      }
    }

    if (test === "notification" || test === "both") {
      if (!notificationResult.error && smokeTestKey && supabaseProjectRef) {
        Object.assign(
          notificationResult,
          await sendNotificationSmokeEmail(
            supabaseProjectRef,
            smokeTestKey,
            targetEmail,
            scenario,
            supabaseAuthToken,
          ),
        );
      } else {
        notificationResult.success = false;
      }
    }
  } catch (error) {
    const message = truncateError(error instanceof Error ? error.message : "Unknown smoke test error");

    if (test === "collab" || test === "both") {
      if (!collabResult.attempted) {
        collabResult.attempted = true;
        collabResult.status = 500;
        collabResult.success = false;
        collabResult.error = message;
      }
    }

    if (test === "notification" || test === "both") {
      if (!notificationResult.attempted) {
        notificationResult.attempted = true;
        notificationResult.status = 500;
        notificationResult.success = false;
        notificationResult.error = message;
      }
    }
  }

  const attemptedResults = [collabResult, notificationResult].filter((item) => item.attempted);
  const overallSuccess = attemptedResults.length > 0 && attemptedResults.every((item) => item.success);

  return res.status(200).json({
    success: overallSuccess,
    scenario,
    results: {
      collab: collabResult,
      notification: notificationResult,
    },
  });
}
