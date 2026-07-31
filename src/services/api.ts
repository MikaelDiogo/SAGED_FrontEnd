import axios from 'axios';

export const api = axios.create({
  baseURL:
    (import.meta.env.VITE_API_URL as string | undefined) ??
    'http://localhost:8080/api/v1/saged',
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (!config.headers['X-Correlation-Id']) {
    config.headers['X-Correlation-Id'] = crypto.randomUUID();
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('saged:unauthorized'));
    }
    // Extract Problem Details (RFC 7807) message when available
    const detail = error.response?.data?.detail as string | undefined;
    if (detail) error.message = detail;
    return Promise.reject(error);
  }
);
