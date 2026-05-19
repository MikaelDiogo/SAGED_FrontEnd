import { createContext } from 'react';
import type { User, SignInCredentials } from '../types';

export interface AuthContextData {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export const AuthContext = createContext({} as AuthContextData);