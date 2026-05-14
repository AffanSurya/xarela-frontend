"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
    LayoutDashboard, 
    Wallet, 
    TrendingDown, 
    LogOut, 
    User as UserIcon, 
    Globe,
    Menu,
    Target
} from "lucide-react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const navigation: NavItem[] = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Transactions", href: "#", icon: Wallet },
    { label: "Expenses", href: "/expenses", icon: TrendingDown },
    { label: "Retirement", href: "/retirement", icon: Target },
];

interface DashboardLayoutProps {
    children: ReactNode;
    title?: string;
}

export default function DashboardLayout({ children, title = "Overview" }: DashboardLayoutProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isExiting, setIsExiting] = useState(false);

    const handleSignOut = async () => {
        setIsExiting(true);
        await logout();
    };

    // Extract initials for fallback avatars
    const getInitials = (name?: string) => {
        if (!name) return "TR";
        return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    };

    return (
        <div className="db-layout">
            {/* Left Navigation Sidebar */}
            <aside className="db-sidebar">
                <div className="db-sidebar-logo">
                    <div className="db-sidebar-logo-icon">
                        <Globe size={18} strokeWidth={2.5} />
                    </div>
                    <span>Xarela</span>
                </div>

                <nav className="db-nav">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link 
                                key={item.label} 
                                href={item.href}
                                className={`db-nav-item ${isActive ? "active" : ""}`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area Grid */}
            <div className="db-content-wrapper">
                <header className="db-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {/* Quick Mobile Burger (CSS hidden on Desktop) */}
                        <button style={{ background: "none", border: "none", color: "var(--muted)", padding: 0, cursor: "pointer" }} className="mobile-only">
                            <Menu size={22} />
                        </button>
                        <h1 className="db-header-title">{title}</h1>
                    </div>

                    <div className="db-user-menu">
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#ffffff" }}>
                                {user?.fullName || "Trader"}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                                Authenticated
                            </span>
                        </div>
                        
                        <div className="db-user-avatar" aria-hidden="true">
                            {getInitials(user?.fullName)}
                        </div>

                        <div style={{ width: 1, height: 24, background: "var(--surface-border)", margin: "0 8px" }} />

                        <button 
                            onClick={handleSignOut}
                            disabled={isExiting}
                            className="btn-primary"
                            style={{ 
                                width: "auto", 
                                padding: "8px 14px", 
                                fontSize: "0.8rem",
                                background: "rgba(239, 68, 68, 0.06)",
                                color: "#fca5a5",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                boxShadow: "none"
                            }}
                            title="Sign Out"
                        >
                            {isExiting ? "..." : <LogOut size={14} />}
                        </button>
                    </div>
                </header>

                <main className="db-main">
                    {children}
                </main>
            </div>
        </div>
    );
}
