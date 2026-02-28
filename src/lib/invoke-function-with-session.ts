import { supabase } from "@/integrations/supabase/client";

type InvokeOptions = {
  body?: unknown;
  headers?: Record<string, string>;
};

const getAccessToken = async () => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }

  const session = sessionData.session;
  const isExpiringSoon = !session?.expires_at || session.expires_at * 1000 <= Date.now() + 60_000;

  if (!session || isExpiringSoon) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session?.access_token) {
      throw refreshError ?? new Error("No active session");
    }
    return refreshData.session.access_token;
  }

  return session.access_token;
};

export const invokeFunctionWithSession = async <T = unknown>(
  functionName: string,
  options: InvokeOptions = {},
) => {
  const accessToken = await getAccessToken();

  const invoke = () =>
    supabase.functions.invoke<T>(functionName, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let response = await invoke();
  if (response.error && (response.error as { context?: { status?: number } }).context?.status === 401) {
    const refreshedToken = await getAccessToken();
    response = await supabase.functions.invoke<T>(functionName, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${refreshedToken}`,
      },
    });
  }

  return response;
};
