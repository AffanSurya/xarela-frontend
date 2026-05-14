"use client";

import React, { useState, useEffect } from "react";
import { snapshotsApiClient, SnapshotRecord } from "@/lib/api-client";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { SummaryCard, SkeletonCard } from "@/components/dashboard/SummaryCard";
import EmptyState from "@/components/dashboard/EmptyState";
import { 
    TrendingUp, 
    ShieldAlert, 
    PiggyBank, 
    CreditCard,
    LineChart,
    Calendar
} from "lucide-react";

export default function HomePage() {
    return (
        <AuthGuard>
            <DashboardContent />
        </AuthGuard>
    );
}

function DashboardContent() {
    const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Connect portfolio feeds on runtime bootstrap
    useEffect(() => {
        async function loadSnapshots() {
            try {
                setIsLoading(true);
                const res = await snapshotsApiClient.list();
                // Server orders by snapshot_date DESC, latest is index [0]
                setSnapshots(res.data || []);
            } catch (err: any) {
                setError(err.message || "Could not restore snapshot metrics.");
            } finally {
                setIsLoading(false);
            }
        }
        loadSnapshots();
    }, []);

    // Extract LATEST active snapshot record
    const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;

    // Format date nicely (YYYY-MM-DD to readable)
    const formatSnapshotDate = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
            const dateObj = new Date(dateStr);
            return new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            }).format(dateObj);
        } catch {
            return dateStr;
        }
    };

    return (
        <DashboardLayout title="Dashboard">
            <header style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--accent)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
                    <LineChart size={14} />
                    <span>Portfolio Status</span>
                </div>
                <h2 style={{ margin: 0, fontSize: "1.85rem", fontWeight: 700, color: "#ffffff" }}>
                    Finance Overview
                </h2>
            </header>

            {/* Inline Loader Phase */}
            {isLoading && (
                <div className="summary-grid">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            )}

            {/* Connectivity Failure State */}
            {!isLoading && error && (
                <div className="error-alert" style={{ maxWidth: 600, margin: "0 auto 32px" }}>
                    <ShieldAlert size={20} />
                    <div>
                        <h4 style={{ margin: "0 0 4px", fontWeight: 600 }}>Gateway sync failure</h4>
                        <p style={{ margin: 0, opacity: 0.8, fontSize: "0.85rem" }}>{error}</p>
                    </div>
                </div>
            )}

            {/* Active Success Pipeline */}
            {!isLoading && !error && (
                <>
                    {latestSnapshot ? (
                        <div className="summary-grid">
                            <SummaryCard 
                                label="Net Worth" 
                                value={latestSnapshot.net_worth} 
                                icon={<TrendingUp size={16} />} 
                                primary={true}
                                metaText={`Calculated on ${formatSnapshotDate(latestSnapshot.snapshot_date)}`}
                            />
                            <SummaryCard 
                                label="Total Assets" 
                                value={latestSnapshot.total_assets} 
                                icon={<PiggyBank size={16} />}
                                metaText="All liquid & locked stores"
                            />
                            <SummaryCard 
                                label="Total Liabilities" 
                                value={latestSnapshot.total_liabilities} 
                                icon={<CreditCard size={16} />}
                                metaText="Outstanding credit lines"
                            />
                        </div>
                    ) : (
                        /* Handover to curated empty display if snapshots empty */
                        <EmptyState 
                            actionLabel="Synchronize Engine" 
                            onActionClick={() => {
                                // Future action logic or trigger ingestor placeholder
                                window.location.reload();
                            }} 
                        />
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
