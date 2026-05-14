"use client";

import React from "react";

interface SummaryCardProps {
    label: string;
    value: string;
    icon?: React.ReactNode;
    primary?: boolean;
    currency?: string;
    metaText?: string;
}

export function SummaryCard({ 
    label, 
    value, 
    icon, 
    primary = false, 
    currency = "IDR",
    metaText
}: SummaryCardProps) {
    
    // Formatting numerical balances
    const formatCurrency = (valStr: string, currencyCode: string) => {
        const numeric = parseFloat(valStr);
        if (isNaN(numeric)) return valStr;

        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numeric);
    };

    return (
        <div className={`summary-card ${primary ? "card-primary" : ""}`}>
            <div className="card-label">
                {icon && <span style={{ opacity: 0.8 }}>{icon}</span>}
                {label}
            </div>
            
            <div className="card-value">
                {formatCurrency(value, currency)}
            </div>

            {metaText && (
                <div className="card-footer-meta">
                    {metaText}
                </div>
            )}
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="summary-card" style={{ pointerEvents: "none" }}>
            {/* Fake Label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div className="skeleton-base" style={{ width: 16, height: 16, borderRadius: 4 }} />
                <div className="skeleton-base skeleton-text" style={{ width: 100, marginBottom: 0, height: 14 }} />
            </div>

            {/* Fake Big Value */}
            <div className="skeleton-base skeleton-text" style={{ width: "80%", height: 36, marginBottom: 14 }} />

            {/* Fake Footer Meta */}
            <div className="skeleton-base skeleton-text" style={{ width: "40%", height: 12, marginBottom: 0 }} />
        </div>
    );
}
