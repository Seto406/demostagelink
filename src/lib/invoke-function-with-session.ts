import { supabase } from "@/integrations/supabase/client";

type InvokeOptions = {
  body?: unknown;
  headers?: Record<string, string>;
};

const getAccessToken = async (forceRefresh = false) => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }

  const session = sessionData.session;
  const isExpiringSoon = !session?.expires_at || session.expires_at * 1000 <= Date.now() + 60_000;
  const shouldRefresh = forceRefresh || !session || isExpiringSoon;

  if (shouldRefresh) {
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
  const isUnauthorizedError = (error: unknown) => {
    const candidate = error as {
      message?: string;
      context?: { status?: number; statusCode?: number };
      status?: number;
      statusCode?: number;
    } | null;

    if (!candidate) return false;

    const status =
      candidate.context?.status ??
      candidate.context?.statusCode ??
      candidate.status ??
      candidate.statusCode;

    if (status === 401) return true;

    const message = candidate.message?.toLowerCase() ?? "";
    return message.includes("401") || message.includes("unauthorized") || message.includes("invalid jwt");
  };

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
  if (response.error && isUnauthorizedError(response.error)) {
    const refreshedToken = await getAccessToken(true);
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
