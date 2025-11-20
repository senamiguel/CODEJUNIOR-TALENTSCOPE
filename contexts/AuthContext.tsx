import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, isConfigValid } from '../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
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
      return () => {};
    }
  }, []);

  const loginWithGoogle = async () => {
    if (!isConfigValid || !auth || !googleProvider) {
      const mockUser = {
        uid: 'demo-user-123',
        displayName: 'Admin (Demo)',
        email: 'admin@code.je',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'mock-token',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null
      } as unknown as User;

      setCurrentUser(mockUser);
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error logging in with Google", error);
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
    <AuthContext.Provider value={{ currentUser, loading, loginWithGoogle, logout, isDemoMode: !isConfigValid }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};