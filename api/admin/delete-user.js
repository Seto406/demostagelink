import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ error: "Server environment is not configured correctly" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user: requester },
    error: requesterError,
  } = await userClient.auth.getUser();

  if (requesterError || !requester) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: requesterProfile, error: requesterProfileError } = await userClient
    .from("profiles")
    .select("role")
    .eq("user_id", requester.id)
    .single();

  if (requesterProfileError || requesterProfile?.role !== "admin") {
    return res.status(403).json({ error: "Only admins can delete users" });
  }

  const { user_id: userId, profile_id: profileId } = req.body ?? {};

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  if (profileId) {
    const { error: showsError } = await supabaseAdmin.from("shows").delete().eq("producer_id", profileId);
    if (showsError) {
      return res.status(400).json({ error: showsError.message });
    }
  }

  // Clean up profile records explicitly before deleting auth user.
  // Some environments have legacy schema drift where profiles.user_id is not
  // enforced with ON DELETE CASCADE, which can leave orphaned records visible
  // in the admin dashboard after auth deletion.
  const profileDeleteQuery = supabaseAdmin
    .from("profiles")
    .delete();

  const { error: profileDeleteError } = profileId
    ? await profileDeleteQuery.or(`user_id.eq.${userId},id.eq.${profileId}`)
    : await profileDeleteQuery.eq("user_id", userId);

  if (profileDeleteError) {
    return res.status(400).json({ error: profileDeleteError.message });
  }

  const { error: requestsError } = await supabaseAdmin
    .from("producer_requests")
    .delete()
    .eq("user_id", userId);

  if (requestsError) {
    return res.status(400).json({ error: requestsError.message });
  }

  // Force hard-delete so the auth UID is removed entirely.
  // Supabase's default behavior can soft-delete and leave a tombstoned UID.
  const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId, false);
  if (deleteUserError) {
    const normalizedMessage = (deleteUserError.message || "").toLowerCase();
    const userAlreadyMissing =
      normalizedMessage.includes("user not found") ||
      normalizedMessage.includes("not found");

    // Treat already-missing auth records as a successful cleanup.
    // This allows admins to remove stale profile rows that no longer have
    // matching auth.users entries.
    if (!userAlreadyMissing) {
      return res.status(400).json({ error: deleteUserError.message });
    }
  }

  return res.status(200).json({ success: true, message: "User deleted successfully" });
}
