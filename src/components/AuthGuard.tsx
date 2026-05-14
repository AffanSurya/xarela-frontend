"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Push users who hit protected assets back to sign-in
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                background: "radial-gradient(circle at 50% 50%, var(--bg-soft) 0%, var(--bg) 100%)"
            }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                    <svg className="spinner" viewBox="0 0 50 50" style={{ width: 44, height: 44, color: "var(--accent-strong)" }}>
                        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="currentColor" />
                    </svg>
                    <span style={{ 
                        color: "var(--muted)", 
                        fontSize: "0.75rem", 
                        letterSpacing: "0.2em", 
                        fontWeight: 600, 
                        textTransform: "uppercase" 
                    }}>
                        Restoring session
                    </span>
                </div>
            </div>
        );
    }

    // Block flashes of unauthenticated content during redirection state
    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
