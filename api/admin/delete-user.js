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

  const { error: requestsError } = await supabaseAdmin
    .from("producer_requests")
    .delete()
    .eq("user_id", userId);

  if (requestsError) {
    return res.status(400).json({ error: requestsError.message });
  }

  const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    return res.status(400).json({ error: deleteUserError.message });
  }

  return res.status(200).json({ success: true, message: "User deleted successfully" });
}
