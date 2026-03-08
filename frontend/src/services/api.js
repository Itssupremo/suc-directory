import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// SUCs — authenticated
export const getSucs = () => API.get('/sucs');
export const createSuc = (data) => API.post('/sucs', data);
export const updateSuc = (id, data) => API.put(`/sucs/${id}`, data);
export const deleteSuc = (id) => API.delete(`/sucs/${id}`);
export const transferSuc = (id, data) => API.put(`/sucs/${id}/transfer`, data);

// SUCs — public
export const getPublicSucs = (region) =>
  API.get('/sucs/public', { params: region ? { region } : {} });
export const getOccOfficials = () => API.get('/sucs/occ-officials');

// Users — admin only
export const getUsers = () => API.get('/users');
export const createUser = (data) => API.post('/users', data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

export default API;
