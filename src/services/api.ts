import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  withCredentials: true, // Permite envio de cookies HttpOnly para autenticação baseada em token
});

// O interceptor de request foi removido para evitar o envio manual de headers de privilégio (RBAC Bypass).
// Agora o backend identifica o usuário e seu papel estritamente através do Cookie HttpOnly 'token'.

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isMeRoute = error.config?.url?.includes('/sessions/me');

    // Se o backend responder 401, significa que o Cookie expirou ou é inválido.
    // Mas NÃO redirecionamos se for a rota de verificação inicial, para evitar loops.
    if (error.response?.status === 401 && !isMeRoute) {
      localStorage.removeItem('@SAGE:user');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);