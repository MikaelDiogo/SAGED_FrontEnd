import { type ReactNode, useEffect } from 'react';
import { AuthProvider as OidcProvider, useAuth } from 'react-oidc-context';
import { AuthContext } from './AuthContext';
import type { User, SagedRole } from '../types';
import { setAccessToken } from '../services/api';
import { oidcConfig } from '../auth/oidcConfig';

const SAGED_ROLES: SagedRole[] = [
  'SAGED_ADMIN_GERAL',
  'SAGED_ADMIN_SETOR',
  'SAGED_TECNICO_LIDER',
  'SAGED_TECNICO',
];

function extractRole(roles: string[] | undefined): SagedRole {
  return SAGED_ROLES.find((r) => roles?.includes(r)) ?? 'SAGED_TECNICO';
}

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function SagedContextBridge({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    setAccessToken(auth.user?.access_token ?? null);
  }, [auth.user]);

  // Claims that matter (roles, org, specialty) live in the access token, not the ID token
  const accessClaims = auth.user?.access_token
    ? decodeJwt(auth.user.access_token)
    : {};

  const profile = auth.user?.profile;
  const realmRoles = (
    accessClaims.realm_access as { roles?: string[] } | undefined
  )?.roles;

  const user: User | null =
    auth.isAuthenticated && profile
      ? {
          id: (accessClaims.sub as string | undefined) ?? profile.sub ?? '',
          name:
            (accessClaims.name as string | undefined) ??
            (accessClaims.preferred_username as string | undefined) ??
            (profile.name as string | undefined) ??
            (profile.preferred_username as string | undefined) ??
            '',
          email:
            (accessClaims.email as string | undefined) ??
            (profile.email as string | undefined) ??
            '',
          role: extractRole(realmRoles),
          departmentId: accessClaims.org_unit_id as string | undefined,
          specialtyCodes: accessClaims.specialty_codes as string | undefined,
        }
      : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: auth.isAuthenticated,
        loading: auth.isLoading,
        signIn: () => void auth.signinRedirect(),
        signOut: () => void auth.signoutRedirect(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <OidcProvider {...oidcConfig}>
      <SagedContextBridge>{children}</SagedContextBridge>
    </OidcProvider>
  );
}
