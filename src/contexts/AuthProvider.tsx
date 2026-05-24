import { useState, useEffect, type ReactNode } from 'react';
import type { User, SignInCredentials } from '../types';
import { api } from '../services/api';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions/me')
      .then(res => {
        const userData = res.data.user;
        setUser(userData);
        localStorage.setItem('@SAGE:user', JSON.stringify(userData));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('@SAGE:user');
      })
      .finally(() => setLoading(false));
  }, []);

  const isAuthenticated = !!user;

  async function signIn({ email, password }: SignInCredentials) {
    const response = await api.post('/sessions', { email, password });
    const { user: userData } = response.data;

    localStorage.setItem('@SAGE:user', JSON.stringify(userData));

    setUser(userData);
  }

  const signOut = async () => {
    try {
      await api.delete('/sessions');
    } catch {
      // ignora erro de rede, prossegue com limpeza local
    }
    localStorage.removeItem('@SAGE:user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ signIn, signOut, user, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}