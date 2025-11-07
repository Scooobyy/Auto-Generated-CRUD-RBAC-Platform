import axios from 'axios';

const API_BASE_URL = '/api'; // Vite proxy will handle this

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const modelsAPI = {
  getAll: () => api.get('/models'),
  getByName: (name) => api.get(`/models/${name}`),
  create: (modelData) => api.post('/models', modelData),
  delete: (name) => api.delete(`/models/${name}`),
};

export const dataAPI = {
  getAll: (modelName) => api.get(`/data/${modelName}`),
  getById: (modelName, id) => api.get(`/data/${modelName}/${id}`),
  create: (modelName, data) => api.post(`/data/${modelName}`, data),
  update: (modelName, id, data) => api.put(`/data/${modelName}/${id}`, data),
  delete: (modelName, id) => api.delete(`/data/${modelName}/${id}`),
};

export default api;