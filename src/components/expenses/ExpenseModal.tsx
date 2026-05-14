"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { ExpenseCategoryRecord, CreateExpensePayload } from "@/lib/api-client";

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: CreateExpensePayload) => Promise<void>;
    categories: ExpenseCategoryRecord[];
}

export default function ExpenseModal({ isOpen, onClose, onSubmit, categories }: ExpenseModalProps) {
    const [categoryId, setCategoryId] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("IDR");
    const [occurredOn, setOccurredOn] = useState("");
    const [merchant, setMerchant] = useState("");
    const [note, setNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill current local date YYYY-MM-DD on mount/open
    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split("T")[0];
            setOccurredOn(today);
            
            // Pre-select first category if exists
            if (categories.length > 0 && !categoryId) {
                setCategoryId(categories[0].id);
            }
            
            // Reset error and input caching
            setError(null);
            setAmount("");
            setMerchant("");
            setNote("");
        }
    }, [isOpen, categories]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!categoryId) {
            setError("Please select an expense category.");
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Please enter a valid amount greater than zero.");
            return;
        }

        if (!occurredOn) {
            setError("Please select an occurrence date.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                category_id: categoryId,
                amount: amount.trim(), // Backend accepts standard string decimal
                currency,
                occurred_on: occurredOn,
                merchant: merchant.trim() || undefined,
                note: note.trim() || undefined,
                payment_method: paymentMethod || undefined,
            });
            onClose(); // Successfully saved!
        } catch (err: any) {
            setError(err.message || "Failed to create expense. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            {/* Prevent click bubbling out to overlay backdrop */}
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <header className="modal-header">
                    <h3 className="modal-title">Add New Expense</h3>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                    <div className="modal-body">
                        {error && (
                            <div className="error-alert" style={{ marginBottom: 20 }}>
                                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="expense_category" className="form-label">CATEGORY</label>
                                <select 
                                    id="expense_category"
                                    className="input-control" 
                                    style={{ paddingLeft: 16 }}
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    required
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id} style={{ background: "#0f172a" }}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="expense_date" className="form-label">DATE</label>
                                <input 
                                    id="expense_date"
                                    type="date" 
                                    className="input-control" 
                                    style={{ paddingLeft: 16 }}
                                    value={occurredOn}
                                    onChange={(e) => setOccurredOn(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, marginBottom: 20 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="expense_currency" className="form-label">CUR</label>
                                <input 
                                    id="expense_currency"
                                    type="text" 
                                    className="input-control" 
                                    style={{ paddingLeft: 16, textAlign: "center" }}
                                    value={currency}
                                    readOnly
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="expense_amount" className="form-label">AMOUNT</label>
                                <input 
                                    id="expense_amount"
                                    type="number" 
                                    step="any"
                                    placeholder="50000" 
                                    className="input-control" 
                                    style={{ paddingLeft: 16 }}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label htmlFor="expense_merchant" className="form-label">MERCHANT</label>
                            <input 
                                id="expense_merchant"
                                type="text" 
                                placeholder="e.g. Starbucks" 
                                className="input-control" 
                                style={{ paddingLeft: 16 }}
                                value={merchant}
                                onChange={(e) => setMerchant(e.target.value)}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="expense_payment_method" className="form-label">PAYMENT METHOD</label>
                                <select 
                                    id="expense_payment_method"
                                    className="input-control" 
                                    style={{ paddingLeft: 16 }}
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <option value="Cash" style={{ background: "#0f172a" }}>Cash</option>
                                    <option value="Debit Card" style={{ background: "#0f172a" }}>Debit Card</option>
                                    <option value="Credit Card" style={{ background: "#0f172a" }}>Credit Card</option>
                                    <option value="Bank Transfer" style={{ background: "#0f172a" }}>Bank Transfer</option>
                                    <option value="E-Wallet" style={{ background: "#0f172a" }}>E-Wallet</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="expense_note" className="form-label">NOTE</label>
                                <input 
                                    id="expense_note"
                                    type="text" 
                                    placeholder="Coffee with client" 
                                    className="input-control" 
                                    style={{ paddingLeft: 16 }}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <footer className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Expense"}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}
