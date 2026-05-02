import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getStudentScores = async (studentId: number) => {
  const { data } = await api.get(`/v1/scores/${studentId}`);
  return data;
};

export const getKafkaHealth = async () => {
  const { data } = await api.get('/kafka/health');
  return data;
};

export const applyIRR = async (loanId: number) => {
  const { data } = await api.put(`/api/loans/${loanId}/apply-irr`);
  return data;
};

export const getMilestones = async (studentId: number) => {
  const { data } = await api.get(`/api/milestones/${studentId}`);
  return data;
};

export default api;
