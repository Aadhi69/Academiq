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
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  changePassword: (newPassword: string) => Promise<boolean>;
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

      // Look up user in Firestore / memoryStore
      let matched = await getUserByEmail(email);

      // Explicit roster fallbacks for HOD and Faculty Dr. Vijayakumar
      if (!matched && email === 'hodeee@klu.ac.in') {
        matched = memoryStore.getUser('user_hodeee') || null;
      }
      if (!matched && email === 'k.vijayakumar@klu.ac.in') {
        matched = memoryStore.getUser('user_klu1043') || null;
      }

      if (matched && matched.isActive) {
        setUser(matched);
        if (typeof window !== 'undefined') {
          localStorage.setItem('academiq_auth_user_id', matched.id);
        }
        return { success: true, role: matched.role };
      } else {
        await firebaseSignOut(auth);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('academiq_auth_user_id');
        }
        setUser(null);
        return { 
          success: false, 
          error: `Account (${email}) is not registered in the EEE faculty roster. Please contact the HOD (hodeee@klu.ac.in).` 
        };
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Google sign-in popup was closed.' };
      }
      if (err?.code === 'auth/popup-blocked') {
        return { success: false, error: 'Sign-in popup was blocked by your mobile browser. Please allow popups or use Email/Password sign-in below.' };
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

  const loginWithEmail = async (
    emailOrKluid: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    const normalized = (emailOrKluid || '').trim().toLowerCase();
    const found = (await getUserByEmail(normalized)) || memoryStore.getUser(normalized);

    if (!found || !found.isActive) {
      return {
        success: false,
        error: 'Your account is not registered with Academiq. Please check your email/KLU ID or contact the HOD (hodeee@klu.ac.in).',
      };
    }

    // Verify password (check custom password or initial default EEE@Kare)
    const expectedPassword = found.password || 'EEE@Kare';
    const enteredPassword = (password || '').trim();

    if (enteredPassword !== expectedPassword && enteredPassword !== 'EEE@Kare') {
      return {
        success: false,
        error: 'Invalid password. If you recently updated your password, please use your new password. Default is EEE@Kare.',
      };
    }

    setUser(found);
    if (typeof window !== 'undefined') {
      localStorage.setItem('academiq_auth_user_id', found.id);
    }
    return { success: true, role: found.role };
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    const success = memoryStore.updateUserPassword(user.id, newPassword);
    if (success) {
      setUser({ ...user, password: newPassword });
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
        changePassword,
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
