import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, isConfigValid } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConfigValid && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      });
      return unsubscribe;
    } else {
      const localUser = localStorage.getItem('demo_user');
      if (localUser) {
        setCurrentUser(JSON.parse(localUser));
      }
      setLoading(false);
      return () => { };
    }
  }, []);

  const login = async (email: string, password: string) => {
    if (!isConfigValid || !auth) {
      // Demo mode login
      const mockUser = {
        uid: 'demo-user-' + Date.now(),
        displayName: email.split('@')[0],
        email: email,
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => { },
        getIdToken: async () => 'mock-token',
        getIdTokenResult: async () => ({} as any),
        reload: async () => { },
        toJSON: () => ({}),
        phoneNumber: null
      } as unknown as User;

      setCurrentUser(mockUser);
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error logging in", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    if (!isConfigValid || !auth) {
      // Demo mode register
      const mockUser = {
        uid: 'demo-user-' + Date.now(),
        displayName: displayName,
        email: email,
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => { },
        getIdToken: async () => 'mock-token',
        getIdTokenResult: async () => ({} as any),
        reload: async () => { },
        toJSON: () => ({}),
        phoneNumber: null
      } as unknown as User;

      setCurrentUser(mockUser);
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user && displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error) {
      console.error("Error registering", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (!isConfigValid || !auth) {
      console.log("Demo mode: Password reset email would be sent to", email);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email", error);
      throw error;
    }
  };

  const logout = async () => {
    if (!isConfigValid || !auth) {
      setCurrentUser(null);
      localStorage.removeItem('demo_user');
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout, resetPassword, isDemoMode: !isConfigValid }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};