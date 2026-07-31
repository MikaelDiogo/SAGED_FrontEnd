import type { AuthProviderProps } from 'react-oidc-context';

export const oidcConfig: AuthProviderProps = {
  authority:
    (import.meta.env.VITE_KEYCLOAK_URL as string | undefined) ??
    'http://localhost:8180/realms/bcm-sdk',
  client_id:
    (import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string | undefined) ??
    'bcm-sdk-public',
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  scope: 'openid profile email',
  automaticSilentRenew: true,
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};
