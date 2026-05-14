"use client";

import React, { useState, useEffect } from "react";
import { 
    expensesApiClient, 
    categoriesApiClient, 
    ExpenseRecord, 
    ExpenseCategoryRecord,
    CreateExpensePayload
} from "@/lib/api-client";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExpenseModal from "@/components/expenses/ExpenseModal";
import EmptyState from "@/components/dashboard/EmptyState";
import { Plus, Search, Filter, SlidersHorizontal, Calendar } from "lucide-react";

export default function ExpensesPage() {
    return (
        <AuthGuard>
            <DashboardLayout title="Expenses">
                <ExpenseLedger />
            </DashboardLayout>
        </AuthGuard>
    );
}

function ExpenseLedger() {
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [categories, setCategories] = useState<ExpenseCategoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter/Search State Variables
    const [searchKeyword, setSearchKeyword] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Modal Trigger
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Trigger synchronized parallel payload queries on bootstrap
    const refreshData = async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        try {
            const [expensesRes, categoriesRes] = await Promise.all([
                expensesApiClient.list(),
                categoriesApiClient.list()
            ]);

            // Server ordering fallback, sort expenses local desc by occurred_on if required
            const sortedExpenses = (expensesRes.data || []).sort((a, b) => 
                new Date(b.occurred_on).getTime() - new Date(a.occurred_on).getTime()
            );

            setExpenses(sortedExpenses);
            setCategories(categoriesRes.data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Unable to synchronize active financial ledger.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData(true);
    }, []);

    // Handle new insertions
    const handleCreateExpense = async (payload: CreateExpensePayload) => {
        await expensesApiClient.create(payload);
        // Instantly pull refreshed database pool without complete screen refreshes
        await refreshData(false);
    };

    // Local utility to quickly translate category UUID hashes to label tags
    const categoryMap = React.useMemo(() => {
        const map: Record<string, string> = {};
        categories.forEach((c) => {
            map[c.id] = c.name;
        });
        return map;
    }, [categories]);

    // Standard React currency formatters
    const formatMoney = (val: string, currencyCode = "IDR") => {
        const numeric = parseFloat(val);
        if (isNaN(numeric)) return val;
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: 0,
        }).format(numeric);
    };

    // Format OccurredOn dates cleanly
    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            }).format(d);
        } catch {
            return dateStr;
        }
    };

    // Filtering Loop execution
    const filteredExpenses = expenses.filter((exp) => {
        // Category boundary Matcher
        if (selectedCategory !== "all" && exp.category_id !== selectedCategory) {
            return false;
        }

        // Dynamic Case-insensitive Keyword Matcher (Merchant / Note)
        if (searchKeyword.trim() !== "") {
            const keyword = searchKeyword.toLowerCase();
            const merchantMatch = exp.merchant?.toLowerCase().includes(keyword);
            const noteMatch = exp.note?.toLowerCase().includes(keyword);
            
            if (!merchantMatch && !noteMatch) return false;
        }

        return true;
    });

    return (
        <>
            <div className="action-bar">
                <div className="filter-panel">
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <Search size={16} style={{ position: "absolute", left: 12, color: "var(--muted)" }} />
                        <input 
                            type="text"
                            placeholder="Search merchant, notes..."
                            className="filter-input"
                            style={{ paddingLeft: 36, minWidth: 240 }}
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Filter size={15} style={{ color: "var(--muted)" }} />
                        <select 
                            className="filter-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all" style={{ background: "#0f172a" }}>All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id} style={{ background: "#0f172a" }}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                    style={{ width: "auto", padding: "10px 20px", display: "inline-flex", gap: 8 }}
                >
                    <Plus size={18} />
                    New Expense
                </button>
            </div>

            {/* High fidelity Load Skeleton Block */}
            {isLoading && (
                <div className="table-responsive" style={{ minHeight: 240, display: "grid", placeItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                        <svg className="spinner" viewBox="0 0 50 50" style={{ width: 36, height: 36, color: "var(--accent)" }}>
                            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="currentColor" />
                        </svg>
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)", letterSpacing: "0.1em" }}>LOADING LEDGER...</span>
                    </div>
                </div>
            )}

            {/* System Failover Handler */}
            {!isLoading && error && (
                <div className="error-alert">
                    <span>{error}</span>
                </div>
            )}

            {/* Data Ready Sequence */}
            {!isLoading && !error && (
                <>
                    {expenses.length === 0 ? (
                        /* Top Level Empty (No data entered yet) */
                        <EmptyState 
                            title="Clean Slate!"
                            description="Begin logging outbound liquidity channels. Click New Expense to constructing your first item."
                            actionLabel="Create First Expense"
                            onActionClick={() => setIsModalOpen(true)}
                        />
                    ) : filteredExpenses.length === 0 ? (
                        /* Filtered Empty (Data exists, but none match query) */
                        <div className="table-responsive" style={{ padding: "64px 24px", textAlign: "center" }}>
                            <div style={{ color: "var(--muted)", marginBottom: 12 }}>
                                <SlidersHorizontal size={32} style={{ strokeWidth: 1 }} />
                            </div>
                            <h4 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>No logs found</h4>
                            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>Adjust filtering selectors to unveil items.</p>
                        </div>
                    ) : (
                        /* Loaded Matrix Ledger Table Grid */
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Merchant / Description</th>
                                        <th>Category</th>
                                        <th>Method</th>
                                        <th style={{ textAlign: "right" }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem" }}>
                                                    <Calendar size={14} style={{ opacity: 0.6 }} />
                                                    {formatDate(item.occurred_on)}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: "#ffffff" }}>
                                                    {item.merchant || "General Purchase"}
                                                </div>
                                                {item.note && (
                                                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>
                                                        {item.note}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge">
                                                    {categoryMap[item.category_id] || "Unassigned"}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                                                    {item.payment_method || "Cash"}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "right" }} className="text-expense">
                                                -{formatMoney(item.amount, item.currency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Interoperable Overlay Modal Block */}
            <ExpenseModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSubmit={handleCreateExpense}
                categories={categories}
            />
        </>
    );
}
