import { backendConfig } from "@/config/env";

type ApiErrorBody = {
    error?: {
        message?: string;
    };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${backendConfig.baseUrl}${path}`, {
        ...init,
        headers: {
            Accept: "application/json",
            ...init?.headers,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;

        try {
            const body = (await response.json()) as ApiErrorBody;
            if (body.error?.message) {
                message = body.error.message;
            }
        } catch {
            // Keep the default error message when the response is not JSON.
        }

        throw new Error(message);
    }

    return (await response.json()) as T;
}

export const apiClient = {
    getHealth() {
        return request<{ status: string }>("/health");
    },
};
