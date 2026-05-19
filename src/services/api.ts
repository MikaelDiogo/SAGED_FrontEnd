import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@SAGE:token');
  const userJson = localStorage.getItem('@SAGE:user');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user.id) config.headers['user-id'] = String(user.id);
      if (user.role) config.headers['user-role'] = String(user.role);
    } catch (e) {
      console.error("Erro ao injetar contexto nos headers", e);
    }
  }

  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Trata o 401 de forma controlada sem gerar loops infinitos
    if (error.response?.status === 401 && localStorage.getItem('@SAGE:token')) {
      localStorage.removeItem('@SAGE:token');
      localStorage.removeItem('@SAGE:user');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);