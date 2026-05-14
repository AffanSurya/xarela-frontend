"use client";

import React from "react";
import { Layers, Plus } from "lucide-react";

interface EmptyStateProps {
    title?: string;
    description?: string;
    actionLabel?: string;
    onActionClick?: () => void;
}

export default function EmptyState({
    title = "No snapshot data yet",
    description = "Once transactions are synced, automated daily net worth metrics will illuminate your cards here.",
    actionLabel,
    onActionClick
}: EmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-icon-box">
                <Layers size={28} strokeWidth={1.5} />
            </div>
            
            <h3 className="empty-title">{title}</h3>
            <p className="empty-subtitle">{description}</p>

            {actionLabel && onActionClick && (
                <button 
                    onClick={onActionClick} 
                    className="btn-primary"
                    style={{ width: "auto", padding: "12px 24px", display: "inline-flex", gap: 8 }}
                >
                    <Plus size={16} />
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
