import { backendConfig } from "@/config/env";
import { getCookie, setCookie, deleteCookie } from "./cookies";

type ApiErrorBody = {
    error?: {
        code?: string;
        message?: string;
    };
};

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
    accessToken = token;
}

export function getAccessToken() {
    return accessToken;
}

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
    const headers: Record<string, string> = {
        Accept: "application/json",
        ...((init?.headers || {}) as Record<string, string>),
    };

    // Automatically inject JWT bearer token if present
    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${backendConfig.baseUrl}${path}`, {
        ...init,
        headers,
        cache: "no-store",
    });

    // Interceptor: automatic token refresh on 401s
    if (response.status === 401 && !isRetry && path !== "/api/v1/auth/login" && path !== "/api/v1/auth/refresh") {
        const storedRefresh = getCookie("refresh_token");
        if (storedRefresh) {
            try {
                const res = await authApiClient.refresh(storedRefresh);
                setAccessToken(res.data.access_token);
                setCookie("refresh_token", res.data.refresh_token);
                
                // Recursively retry original request with updated auth memory
                return request<T>(path, init, true);
            } catch {
                // Silently ignore and wipe session if refresh itself is dead
                setAccessToken(null);
                deleteCookie("refresh_token");
            }
        }
    }

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        let code = "unknown_error";

        try {
            const body = (await response.json()) as ApiErrorBody;
            if (body.error?.message) message = body.error.message;
            if (body.error?.code) code = body.error.code;
        } catch {
            // Handled
        }

        const error = new Error(message) as any;
        error.status = response.status;
        error.code = code;
        throw error;
    }

    return (await response.json()) as T;
}

export interface AuthTokenResponse {
    data: {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    };
}

export const apiClient = {
    getHealth() {
        return request<{ status: string }>("/health");
    },
};

export const authApiClient = {
    login(credentials: any) {
        return request<AuthTokenResponse>("/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });
    },
    register(data: any) {
        return request<AuthTokenResponse>("/api/v1/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    },
    refresh(refreshToken: string) {
        return request<AuthTokenResponse>("/api/v1/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
    },
    logout(refreshToken: string) {
        return request<any>("/api/v1/auth/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
    },
};

export const userApiClient = {
    getSettings() {
        return request<{ data: { full_name: string; base_currency: string; timezone: string } }>("/api/v1/user/settings");
    },
};

export interface SnapshotRecord {
    id: string;
    snapshot_date: string;
    net_worth: string;
    total_assets: string;
    total_liabilities: string;
    crypto_value: string;
    stock_value: string;
    cash_value: string;
    annualized_expense: string;
    savings_rate: string;
}

export const snapshotsApiClient = {
    list() {
        return request<{ data: SnapshotRecord[] }>("/api/v1/portfolio-snapshots");
    },
};
