"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApiClient, userApiClient, setAccessToken } from "@/lib/api-client";
import { getCookie, setCookie, deleteCookie } from "@/lib/cookies";

export interface User {
    id?: string;
    email: string;
    fullName?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Silent Re-Authentication on Application Boot
    useEffect(() => {
        async function initSession() {
            const storedRefresh = getCookie("refresh_token");
            if (!storedRefresh) {
                setIsLoading(false);
                return;
            }

            try {
                // Silent refresh restores the backend memory state
                const res = await authApiClient.refresh(storedRefresh);
                setAccessToken(res.data.access_token);
                setCookie("refresh_token", res.data.refresh_token);

                // Immediately pull user name profile
                const profileRes = await userApiClient.getSettings();
                setUser({
                    email: "", // Backend token refresh lacks email, but user context has full name
                    fullName: profileRes.data.full_name,
                });
            } catch (err) {
                // Clear invalid token chains
                setAccessToken(null);
                deleteCookie("refresh_token");
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        }
        initSession();
    }, []);

    const login = async (credentials: any) => {
        const res = await authApiClient.login(credentials);
        setAccessToken(res.data.access_token);
        setCookie("refresh_token", res.data.refresh_token);

        // After logging in, grab User Name for visual greetings
        const profileRes = await userApiClient.getSettings();
        setUser({
            email: credentials.email,
            fullName: profileRes.data.full_name,
        });
    };

    const register = async (data: any) => {
        const res = await authApiClient.register(data);
        setAccessToken(res.data.access_token);
        setCookie("refresh_token", res.data.refresh_token);

        const resData = res as any; // Backend returns payload data wrapper
        const returnedUser = resData.data?.user;

        setUser({
            id: returnedUser?.id,
            email: returnedUser?.email || data.email,
            fullName: returnedUser?.full_name || data.full_name,
        });
    };

    const logout = async () => {
        const storedRefresh = getCookie("refresh_token");
        try {
            if (storedRefresh) {
                await authApiClient.logout(storedRefresh);
            }
        } catch {
            // Swallow sign out connection failures
        } finally {
            setAccessToken(null);
            deleteCookie("refresh_token");
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
