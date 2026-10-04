'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest } from './api';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    rollNumber: string;
    course: string;
    year: number;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('campushub_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = await apiRequest<User>('/auth/me');
      setUser(userData);
    } catch (err) {
      localStorage.removeItem('campushub_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('campushub_token', res.token);
    await refreshUser();
    router.push('/dashboard');
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    rollNumber: string;
    course: string;
    year: number;
  }) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    localStorage.setItem('campushub_token', res.token);
    await refreshUser();
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('campushub_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
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
