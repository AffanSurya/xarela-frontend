"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, AlertCircle } from "lucide-react";

export default function RegisterPage() {
    const { register, isAuthenticated } = useAuth();
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/");
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!fullName.trim() || !email.trim() || !password) {
            setError("Please fill in all required fields.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);
        try {
            await register({
                full_name: fullName,
                email,
                password
            });
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="auth-container">
            <div className="auth-card">
                <header className="auth-header">
                    <h1 className="auth-title">Create account</h1>
                    <p className="auth-subtitle">Begin your journey to automated wealth analytics</p>
                </header>

                {error && (
                    <div className="error-alert">
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="fullName" className="form-label">FULL NAME</label>
                        <div className="input-wrapper">
                            <input
                                id="fullName"
                                type="text"
                                className="input-control"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <User className="input-icon" size={18} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">EMAIL ADDRESS</label>
                        <div className="input-wrapper">
                            <input
                                id="email"
                                type="email"
                                className="input-control"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <Mail className="input-icon" size={18} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">PASSWORD</label>
                        <div className="input-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="input-control"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <Lock className="input-icon" size={18} />
                            <button
                                type="button"
                                className="input-toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: 12 }}>
                        {isLoading ? (
                            <>
                                <svg className="spinner" viewBox="0 0 50 50">
                                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="currentColor" />
                                </svg>
                                Creating account...
                            </>
                        ) : (
                            <>
                                Get Started <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <footer className="auth-footer">
                    Already have an account?{" "}
                    <Link href="/login" className="auth-link">
                        Sign in instead
                    </Link>
                </footer>
            </div>
        </main>
    );
}
