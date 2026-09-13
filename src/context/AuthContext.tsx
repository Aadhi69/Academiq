'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { memoryStore, getUserByEmail, seedInitialUsersToFirestore } from '@/lib/firebase/db';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase/config';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  loginAsDemoUser: (userId: string) => void;
  loginWithEmail: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial session & setup auth listeners
  useEffect(() => {
    const initAuth = async () => {
      // Seed initial roster into Firestore if needed (idempotent)
      if (isFirebaseConfigured) {
        seedInitialUsersToFirestore().catch(() => {});
      }

      // Check stored user session
      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('academiq_auth_user_id') : null;
      if (storedUserId) {
        const found = memoryStore.getUser(storedUserId);
        if (found) {
          setUser(found);
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    };

    initAuth();

    // If Firebase Auth is configured, hook up real auth state listener
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser?.email) {
          const matchedUser = await getUserByEmail(firebaseUser.email);
          if (matchedUser && matchedUser.isActive) {
            setUser(matchedUser);
            if (typeof window !== 'undefined') {
              localStorage.setItem('academiq_auth_user_id', matchedUser.id);
            }
          } else {
            // Not registered in Academiq
            if (typeof window !== 'undefined') {
              localStorage.removeItem('academiq_auth_user_id');
            }
            setUser(null);
          }
        }
        setLoading(false);
      });
      return () => {
        unsubscribe();
      };
    }
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    try {
      if (!isFirebaseConfigured || !auth || !googleProvider) {
        return { 
          success: false, 
          error: 'Firebase Authentication is not configured. Please check environment variables.' 
        };
      }

      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email?.toLowerCase().trim();

      if (!email) {
        await firebaseSignOut(auth);
        return { 
          success: false, 
          error: 'Unable to retrieve email from Google Authentication.' 
        };
      }

      // Step 2 & 3: Look up user in Firestore
      const matched = await getUserByEmail(email);

      if (matched && matched.isActive) {
        setUser(matched);
        if (typeof window !== 'undefined') {
          localStorage.setItem('academiq_auth_user_id', matched.id);
        }
        return { success: true, role: matched.role };
      } else {
        // Step 7: Deny access with exact message & sign out
        await firebaseSignOut(auth);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('academiq_auth_user_id');
        }
        setUser(null);
        return { 
          success: false, 
          error: 'Your account is not registered with Academiq. Please contact the HOD.' 
        };
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in cancelled by user.' };
      }
      return { success: false, error: err?.message || 'Google sign-in failed.' };
    }
  };

  const loginAsDemoUser = (userId: string) => {
    const found = memoryStore.getUser(userId);
    if (found) {
      setUser(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('academiq_auth_user_id', found.id);
      }
    }
  };

  const loginWithEmail = async (email: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();
    const found = await getUserByEmail(normalized) || memoryStore.getUser(normalized);
    if (found && found.isActive) {
      setUser(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('academiq_auth_user_id', found.id);
      }
      return true;
    }
    return false;
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch {}
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('academiq_auth_user_id');
    }
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        isAdmin,
        loginWithGoogle,
        loginAsDemoUser,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
