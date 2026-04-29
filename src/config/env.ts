const defaultBackendUrl = "http://localhost:8080";

export const backendConfig = {
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL ?? defaultBackendUrl,
};
