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

export interface ExpenseCategoryRecord {
    id: string;
    name: string;
    parent_id?: string;
    color?: string;
    is_system: boolean;
}

export interface ExpenseRecord {
    id: string;
    category_id: string;
    amount: string;
    currency: string;
    occurred_on: string;
    merchant?: string;
    note?: string;
    payment_method?: string;
    created_at: string;
}

export interface CreateExpensePayload {
    category_id: string;
    amount: string;
    currency: string;
    occurred_on: string;
    merchant?: string;
    note?: string;
    payment_method?: string;
}

export const categoriesApiClient = {
    list() {
        return request<{ data: ExpenseCategoryRecord[] }>("/api/v1/expense-categories");
    },
};

export const expensesApiClient = {
    list() {
        return request<{ data: ExpenseRecord[] }>("/api/v1/expenses");
    },
    create(payload: CreateExpensePayload) {
        return request<{ data: ExpenseRecord }>("/api/v1/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    },
};

export interface RetirementPlanRecord {
    id: string;
    name: string;
    current_age: number;
    target_retirement_age: number;
    target_annual_expense: string;
    inflation_rate: number;
    expected_return_rate: number;
    safe_withdrawal_rate: number;
    target_corpus: string;
}

export interface RetirementPlanPayload {
    name: string;
    current_age: number;
    target_retirement_age: number;
    target_annual_expense: string;
    inflation_rate: number;
    expected_return_rate: number;
    safe_withdrawal_rate: number;
}

export interface RetirementScenarioProjection {
    scenario_name: string;
    risk_profile: string;
    expected_return_rate: number;
    inflation_rate: number;
    projected_corpus_at_retirement: string;
    required_monthly_contribution: string;
}

export interface ComputeRetirementResult {
    plan_id?: string;
    fi_number: string;
    projected_corpus_at_retirement: string;
    required_monthly_contribution: string;
    years_to_retirement: number;
    scenarios: RetirementScenarioProjection[];
}

export const retirementApiClient = {
    listPlans() {
        return request<{ data: RetirementPlanRecord[] }>("/api/v1/retirement-plans");
    },
    createPlan(payload: RetirementPlanPayload) {
        return request<{ data: RetirementPlanRecord }>("/api/v1/retirement-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    },
    updatePlan(id: string, payload: RetirementPlanPayload) {
        return request<{ data: RetirementPlanRecord }>(`/api/v1/retirement-plans/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    },
    compute(id: string) {
        return request<{ data: ComputeRetirementResult }>(`/api/v1/retirement-plans/${id}/compute`, {
            method: "POST",
        });
    },
};
