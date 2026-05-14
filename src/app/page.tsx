"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { backendConfig } from "@/config/env";
import { LogOut, User, ShieldCheck, Activity } from "lucide-react";

export default function HomePage() {
    return (
        <AuthGuard>
            <HomeDashboard />
        </AuthGuard>
    );
}

function HomeDashboard() {
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
    };

    return (
        <main className="shell">
            <section className="hero" style={{ width: "min(840px, 100%)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
                    <div>
                        <p className="eyebrow">SYSTEM DASHBOARD</p>
                        <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", maxWidth: "none" }}>
                            Hi, {user?.fullName || "Trader"}
                        </h1>
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        style={{ 
                            width: "auto", 
                            padding: "10px 18px", 
                            fontSize: "0.85rem", 
                            background: "rgba(239, 68, 68, 0.06)",
                            color: "#fca5a5",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            boxShadow: "none"
                        }}
                    >
                        {isLoggingOut ? (
                            "Exiting..."
                        ) : (
                            <>
                                <LogOut size={15} /> Disconnect
                            </>
                        )}
                    </button>
                </div>

                <p className="lead" style={{ marginTop: 8 }}>
                    Secure session active. Automatic 401 token interceptors and transparent memory refresh states are guarding API lanes.
                </p>

                <div className="panel" style={{ marginTop: 36 }}>
                    <div style={{ background: "rgba(7, 17, 31, 0.4)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <ShieldCheck size={15} style={{ color: "var(--accent)" }} />
                            <span className="label" style={{ marginBottom: 0 }}>PROTECTED CHANNEL</span>
                        </div>
                        <strong>Authenticated Securely</strong>
                    </div>
                    
                    <div style={{ background: "rgba(7, 17, 31, 0.4)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <User size={15} style={{ color: "var(--accent)" }} />
                            <span className="label" style={{ marginBottom: 0 }}>ACCOUNT OWNER</span>
                        </div>
                        <strong>{user?.fullName || "Retrieving profile..."}</strong>
                    </div>

                    <div style={{ background: "rgba(7, 17, 31, 0.4)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <Activity size={15} style={{ color: "var(--accent)" }} />
                            <span className="label" style={{ marginBottom: 0 }}>BASE GATEWAY</span>
                        </div>
                        <strong style={{ fontSize: "0.9rem" }}>{backendConfig.baseUrl}</strong>
                    </div>
                </div>
            </section>
        </main>
    );
}
