import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        const appUser: User = {
          id: fbUser.uid,
          username: fbUser.displayName || fbUser.email?.split('@')[0] || 'Educator',
          email: fbUser.email || '',
          is_google: fbUser.providerData.some(p => p.providerId === 'google.com'),
        };
        setUser(appUser);
        setToken(idToken);
        localStorage.setItem('examgenius_token', idToken);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('examgenius_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    const appUser: User = {
      id: cred.user.uid,
      username: cred.user.displayName || cred.user.email?.split('@')[0] || 'Educator',
      email: cred.user.email || email,
      is_google: false,
    };
    setUser(appUser);
    setToken(idToken);
  };

  const signup = async (username: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (username) {
      await updateProfile(cred.user, { displayName: username });
    }
    const idToken = await cred.user.getIdToken();
    const appUser: User = {
      id: cred.user.uid,
      username: username || cred.user.email?.split('@')[0] || 'Educator',
      email: cred.user.email || email,
      is_google: false,
    };
    setUser(appUser);
    setToken(idToken);
  };

  const googleLogin = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const idToken = await cred.user.getIdToken();
    const appUser: User = {
      id: cred.user.uid,
      username: cred.user.displayName || cred.user.email?.split('@')[0] || 'Google Educator',
      email: cred.user.email || '',
      is_google: true,
    };
    setUser(appUser);
    setToken(idToken);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    localStorage.removeItem('examgenius_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        googleLogin,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
