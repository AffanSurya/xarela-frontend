import { backendConfig } from "@/config/env";
import { apiClient } from "@/lib/api-client";

const healthPromise = apiClient.getHealth();

export default async function HomePage() {
    const health = await healthPromise.catch(() => null);

    return (
        <main className="shell">
            <section className="hero">
                <p className="eyebrow">Xarela frontend bootstrap</p>
                <h1>App Router, TypeScript, and Bun are ready.</h1>
                <p className="lead">
                    Backend base URL is read from the environment and passed into a small fetch wrapper for
                    future API work.
                </p>

                <div className="panel">
                    <div>
                        <span className="label">Backend URL</span>
                        <strong>{backendConfig.baseUrl}</strong>
                    </div>
                    <div>
                        <span className="label">Health check</span>
                        <strong>{health ? health.status : "unavailable"}</strong>
                    </div>
                </div>
            </section>
        </main>
    );
}
