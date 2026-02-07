export interface User {
    id: string;
    email: string;
    user_metadata: {
        full_name?: string;
        avatar_url?: string | null;
    };
    app_metadata: {
        provider?: string;
        [key: string]: unknown;
    };
    aud: string;
    created_at: string;
}

export interface Session {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: User;
}

export interface CustomWindow extends Window {
    adsbygoogle: Record<string, unknown>[];
    PlaywrightTest: boolean;
    PlaywrightUser: User;
}
