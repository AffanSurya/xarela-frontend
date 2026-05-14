"use client";

import React, { useState, useEffect } from "react";
import { 
    retirementApiClient, 
    RetirementPlanPayload, 
    ComputeRetirementResult,
    RetirementPlanRecord
} from "@/lib/api-client";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
    Calculator, 
    Zap, 
    Compass, 
    AlertCircle,
    HelpCircle,
    Sparkles,
    Timer,
    Flame
} from "lucide-react";

export default function RetirementPage() {
    return (
        <AuthGuard>
            <DashboardLayout title="Retirement Planner">
                <RetirementWorkspace />
            </DashboardLayout>
        </AuthGuard>
    );
}

function RetirementWorkspace() {
    // Persisted DB context caching
    const [existingPlanId, setExistingPlanId] = useState<string | null>(null);
    const [isBootstrapping, setIsBootstrapping] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Live Interactive form inputs
    const [planName, setPlanName] = useState("Primary Retirement Target");
    const [currentAge, setCurrentAge] = useState<number>(25);
    const [targetAge, setTargetAge] = useState<number>(55);
    const [annualExpense, setAnnualExpense] = useState<string>("60000000"); // 60 Mil IDR / year

    // Human-centric percentage models (Automatically mapped to backend scales / 100)
    const [inflationPct, setInflationPct] = useState<number>(4); // 4%
    const [returnPct, setReturnPct] = useState<number>(9);      // 9%
    const [swrPct, setSwrPct] = useState<number>(4);            // 4% SWR

    // Calculation Projection Output caching
    const [results, setResults] = useState<ComputeRetirementResult | null>(null);

    // Initial load: Retrieve stored scenario and run warm math computation
    useEffect(() => {
        async function loadExistingData() {
            try {
                setIsBootstrapping(true);
                const res = await retirementApiClient.listPlans();
                
                if (res.data && res.data.length > 0) {
                    const saved = res.data[0];
                    setExistingPlanId(saved.id);
                    setPlanName(saved.name);
                    setCurrentAge(saved.current_age);
                    setTargetAge(saved.target_retirement_age);
                    setAnnualExpense(saved.target_annual_expense);
                    
                    // Deconstruct fractional decimals back into readable visual 0-100 percentages
                    setInflationPct(Math.round(saved.inflation_rate * 1000) / 10);
                    setReturnPct(Math.round(saved.expected_return_rate * 1000) / 10);
                    setSwrPct(Math.round(saved.safe_withdrawal_rate * 1000) / 10);

                    // Kickoff background warmup computation automatically
                    const calcRes = await retirementApiClient.compute(saved.id);
                    setResults(calcRes.data);
                }
            } catch (err) {
                console.warn("No warm cache scenarios present.");
            } finally {
                setIsBootstrapping(false);
            }
        }
        loadExistingData();
    }, []);

    // Currency localized format helper
    const formatMoney = (valStr?: string) => {
        if (!valStr) return "Rp -";
        const num = parseFloat(valStr);
        if (isNaN(num)) return `Rp ${valStr}`;
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    // Unified computation execution flow
    const handleCompute = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        // Client Boundary Guard
        if (targetAge <= currentAge) {
            setError("Target retirement age must exceed your current age.");
            return;
        }
        if (parseFloat(annualExpense) <= 0 || isNaN(parseFloat(annualExpense))) {
            setError("Annual lifestyle expenses must be greater than zero.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert visual percentages (0-100) into API-compliant rate fractions (0.0-1.0)
            const payload: RetirementPlanPayload = {
                name: planName,
                current_age: currentAge,
                target_retirement_age: targetAge,
                target_annual_expense: annualExpense.trim(),
                inflation_rate: inflationPct / 100,
                expected_return_rate: returnPct / 100,
                safe_withdrawal_rate: swrPct / 100,
            };

            let targetId = existingPlanId;

            if (targetId) {
                // Put updates to cached profile
                await retirementApiClient.updatePlan(targetId, payload);
            } else {
                // Inject clean profile
                const newPlanRes = await retirementApiClient.createPlan(payload);
                targetId = newPlanRes.data.id;
                setExistingPlanId(targetId);
            }

            // Fire compound compute engine on newly updated context
            const computeRes = await retirementApiClient.compute(targetId);
            setResults(computeRes.data);
        } catch (err: any) {
            setError(err.message || "Failed to calculate retirement scenarios.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isBootstrapping) {
        return (
            <div style={{ minHeight: 300, display: "grid", placeItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <svg className="spinner" viewBox="0 0 50 50" style={{ width: 32, height: 32, color: "var(--accent)" }}>
                        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="currentColor" />
                    </svg>
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem", letterSpacing: "0.1em" }}>SYNCING SCENARIOS...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="calc-layout">
            {/* Form side */}
            <div className="calc-card">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <Calculator size={20} style={{ color: "var(--accent)" }} />
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>Scenario Simulator</h3>
                </div>

                {error && (
                    <div className="error-alert" style={{ marginBottom: 20 }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: "0.85rem" }}>{error}</span>
                    </div>
                )}

                <form onSubmit={handleCompute}>
                    <div className="form-group">
                        <label htmlFor="sim_current_age" className="form-label">CURRENT AGE</label>
                        <input 
                            id="sim_current_age"
                            type="number" 
                            className="input-control"
                            value={currentAge}
                            min={1}
                            onChange={(e) => setCurrentAge(Number(e.target.value))}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="sim_target_age" className="form-label">TARGET RETIREMENT AGE</label>
                        <input 
                            id="sim_target_age"
                            type="number" 
                            className="input-control"
                            value={targetAge}
                            min={currentAge + 1}
                            onChange={(e) => setTargetAge(Number(e.target.value))}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="sim_annual_expense" className="form-label">ESTIMATED ANNUAL EXPENSE (TODAY)</label>
                        <div className="input-addon-box">
                            <input 
                                id="sim_annual_expense"
                                type="number" 
                                className="input-control"
                                value={annualExpense}
                                placeholder="e.g. 120000000"
                                onChange={(e) => setAnnualExpense(e.target.value)}
                                required
                            />
                            <span className="input-addon-label">IDR</span>
                        </div>
                        <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "0.75rem" }}>
                            Value today. System compounds this by inflation automatically.
                        </p>
                    </div>

                    <div style={{ height: 1, background: "rgba(255, 255, 255, 0.06)", margin: "24px 0" }} />

                    <div className="form-group">
                        <label htmlFor="sim_return_rate" className="form-label">EXPECTED INVESTMENT RETURN</label>
                        <div className="input-addon-box">
                            <input 
                                id="sim_return_rate"
                                type="number" 
                                step="0.1"
                                className="input-control"
                                value={returnPct}
                                onChange={(e) => setReturnPct(Number(e.target.value))}
                                required
                            />
                            <span className="input-addon-label">%</span>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div className="form-group">
                            <label htmlFor="sim_inflation_rate" className="form-label">INFLATION RATE</label>
                            <div className="input-addon-box">
                                <input 
                                    id="sim_inflation_rate"
                                    type="number" 
                                    step="0.1"
                                    className="input-control"
                                    value={inflationPct}
                                    onChange={(e) => setInflationPct(Number(e.target.value))}
                                    required
                                />
                                <span className="input-addon-label">%</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="sim_swr_rate" className="form-label">WITHDRAWAL RATE (SWR)</label>
                            <div className="input-addon-box">
                                <input 
                                    id="sim_swr_rate"
                                    type="number" 
                                    step="0.1"
                                    className="input-control"
                                    value={swrPct}
                                    onChange={(e) => setSwrPct(Number(e.target.value))}
                                    required
                                />
                                <span className="input-addon-label">%</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ marginTop: 12, gap: 8 }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            "Calculating Compound Matrices..."
                        ) : (
                            <>
                                <Zap size={16} fill="currentColor" />
                                Compute Projections
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Projections Results Pane */}
            <div>
                {results ? (
                    <div>
                        <div className="result-hero">
                            <div className="result-hero-label">
                                <Flame size={14} fill="currentColor" />
                                FIRE INDEPENDENCE TARGET (FI NUMBER)
                            </div>
                            <div className="result-hero-value">
                                {formatMoney(results.fi_number)}
                            </div>
                            <p style={{ margin: "12px 0 0", color: "var(--muted)", fontSize: "0.85rem", maxWidth: 500 }}>
                                Target investment corpus needed at retirement. Once reached, you can theoretically live off returns perpetually using your {swrPct}% safe withdrawal strategy.
                            </p>

                            <div className="result-meta-row">
                                <div className="result-meta-item">
                                    <div className="result-meta-title">Required Monthly Saving</div>
                                    <div className="result-meta-data" style={{ color: "var(--accent)" }}>
                                        {formatMoney(results.required_monthly_contribution)}
                                    </div>
                                </div>

                                <div className="result-meta-item">
                                    <div className="result-meta-title">Years To Target</div>
                                    <div className="result-meta-data">
                                        {results.years_to_retirement} years
                                    </div>
                                </div>

                                <div className="result-meta-item">
                                    <div className="result-meta-title">Growth Baseline Corpus</div>
                                    <div className="result-meta-data">
                                        {formatMoney(results.projected_corpus_at_retirement)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                            <Sparkles size={18} style={{ color: "var(--accent)" }} />
                            Tiered Multi-Risk Scenarios
                        </h4>

                        <div className="scenario-grid">
                            {(results.scenarios || []).map((scen, idx) => (
                                <div className="scenario-card" key={idx}>
                                    <h5 className="scenario-title">{scen.scenario_name}</h5>
                                    <span className="scenario-risk">{scen.risk_profile} risk</span>

                                    <div className="scenario-value">
                                        {formatMoney(scen.projected_corpus_at_retirement)}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 12 }}>
                                        Projected Corpus
                                    </div>

                                    <div className="scenario-meta">
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span>Saving Needed:</span>
                                            <span style={{ color: "#ffffff", fontWeight: 600 }}>
                                                {formatMoney(scen.required_monthly_contribution)} / mo
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                                            <span>Avg. Return:</span>
                                            <span style={{ color: "#ffffff" }}>
                                                {Math.round(scen.expected_return_rate * 1000) / 10}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Visual empty placeholder when math results aren't loaded yet */
                    <div style={{ 
                        background: "rgba(255, 255, 255, 0.01)", 
                        border: "2px dashed rgba(165, 187, 220, 0.08)", 
                        borderRadius: 24, 
                        padding: "80px 40px", 
                        textAlign: "center", 
                        height: "100%", 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center", 
                        justifyContent: "center" 
                    }}>
                        <Compass size={48} style={{ color: "rgba(165, 187, 220, 0.15)", marginBottom: 24 }} />
                        <h4 style={{ color: "#ffffff", margin: "0 0 8px", fontSize: "1.1rem" }}>Projections Await</h4>
                        <p style={{ color: "var(--muted)", maxWidth: 400, margin: 0, fontSize: "0.88rem", lineHeight: 1.6 }}>
                            Fill simulated compound variables on the left form and click Compute to construct glowing graphs, FI targets, and tiered risk breakdowns.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
