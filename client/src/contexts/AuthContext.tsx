import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { trpc } from '@/lib/trpc';

export type InternalUser = {
  id: number;
  username: string;
  role: 'admin' | 'manager' | 'employee' | 'freelancer';
  employeeId?: number | null;
  freelancerId?: number | null;
};

type AuthContextType = {
  user: InternalUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, refetch } = trpc.internalAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = trpc.internalAuth.login.useMutation();
  const logoutMutation = trpc.internalAuth.logout.useMutation();

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
    await refetch();
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    await refetch();
  };

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      loading: isLoading,
      login,
      logout,
      refetch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
