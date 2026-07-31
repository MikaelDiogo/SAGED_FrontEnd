import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextData {
  signIn: () => void;
  signOut: () => void;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export const AuthContext = createContext({} as AuthContextData);
