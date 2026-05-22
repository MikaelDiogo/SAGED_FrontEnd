import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  withCredentials: true, // 👈 Isso garante que o navegador envie o Cookie HttpOnly automaticamente!
});

// O interceptor de request foi removido para evitar o envio manual de headers de privilégio (RBAC Bypass).
// Agora o backend identifica o usuário e seu papel estritamente através do Cookie HttpOnly 'token'.

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se o backend responder 401, significa que o Cookie expirou ou é inválido
    if (error.response?.status === 401) {
      localStorage.removeItem('@SAGE:user');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);