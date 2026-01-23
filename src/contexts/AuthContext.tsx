import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    userEmail: string | null;
    userId: string | null;
    login: (email: string, userId?: string) => void;
    logout: () => void;
    refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Check auth state from localStorage
    const refreshAuth = useCallback(() => {
        const email = localStorage.getItem('customer_email');
        const id = localStorage.getItem('customer_user_id');

        if (email) {
            setIsLoggedIn(true);
            setUserEmail(email);
            setUserId(id);
        } else {
            setIsLoggedIn(false);
            setUserEmail(null);
            setUserId(null);
        }
    }, []);

    // Login function
    const login = useCallback((email: string, id?: string) => {
        localStorage.setItem('customer_email', email);
        if (id) {
            localStorage.setItem('customer_user_id', id);
        }
        setIsLoggedIn(true);
        setUserEmail(email);
        setUserId(id || null);

        // Dispatch event for other components
        window.dispatchEvent(new Event('auth-state-changed'));
    }, []);

    // Logout function
    const logout = useCallback(() => {
        localStorage.removeItem('customer_email');
        localStorage.removeItem('customer_user_id');
        localStorage.removeItem('customer_username');
        localStorage.removeItem('customer_session_id');

        setIsLoggedIn(false);
        setUserEmail(null);
        setUserId(null);

        // Dispatch event for other components
        window.dispatchEvent(new Event('auth-state-changed'));
    }, []);

    // Initialize and listen for auth changes
    useEffect(() => {
        // Initial check
        refreshAuth();

        // Listen for auth state changes (from any component)
        const handleAuthChange = () => {
            refreshAuth();
        };

        window.addEventListener('auth-state-changed', handleAuthChange);
        window.addEventListener('storage', handleAuthChange);

        return () => {
            window.removeEventListener('auth-state-changed', handleAuthChange);
            window.removeEventListener('storage', handleAuthChange);
        };
    }, [refreshAuth]);

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            userEmail,
            userId,
            login,
            logout,
            refreshAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
