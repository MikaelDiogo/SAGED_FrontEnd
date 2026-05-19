import { useState, type ReactNode } from 'react';
import type { User, SignInCredentials } from '../types';
import { api } from '../services/api';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Inicialização síncrona e limpa direto no estado (padrão recomendado pela equipe do React)
  const [user, setUser] = useState<User | null>(() => {
    const storageUser = localStorage.getItem('@SAGE:user');
    if (storageUser) {
      try {
        return JSON.parse(storageUser) as User;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading] = useState(false);
  const isAuthenticated = !!user;

  async function signIn({ email, password }: SignInCredentials) {
    const response = await api.post('/sessions', { email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('@SAGE:token', token);
    localStorage.setItem('@SAGE:user', JSON.stringify(userData));

    setUser(userData);
  }

  const signOut = () => {
    localStorage.removeItem('@SAGE:token');
    localStorage.removeItem('@SAGE:user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ signIn, signOut, user, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}