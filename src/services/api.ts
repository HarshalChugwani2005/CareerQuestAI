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

export const getStudentMe = async () => {
  const { data } = await api.get('/students/me');
  return data;
};

export const getStudentSummary = async (studentId: number) => {
  const { data } = await api.get(`/students/${studentId}/summary`);
  return data;
};

export const getKafkaHealth = async () => {
  const { data } = await api.get('/kafka/health');
  return data;
};

export const applyIRR = async (loanId: number) => {
  const { data } = await api.put(`/loans/${loanId}/apply-irr`);
  return data;
};

export const getMilestones = async (studentId: number) => {
  const { data } = await api.get(`/milestones/${studentId}`);
  return data;
};

export const getIrrSavings = async (studentId: number) => {
  const { data } = await api.get(`/irr/${studentId}/savings`);
  return data;
};

export const getLenderPortfolio = async (lenderId: number, limit = 20, offset = 0) => {
  const { data } = await api.get(`/lenders/${lenderId}/portfolio`, {
    params: { limit, offset },
  });
  return data;
};

export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const updateCurrentUser = async (payload: { name?: string; email?: string }) => {
  const { data } = await api.put('/auth/me', payload);
  return data;
};

export const registerUser = async (name: string, email: string, password: string, role: string) => {
  const { data } = await api.post('/auth/register', { name, email, password, role });
  return data;
};

/**
 * Create a student profile after registration.
 * Calls POST /ingest/student/manual
 */
export const createStudentProfile = async (payload: {
  college_name: string;
  cgpa: number;
  course: string;
  graduation_year: number;
  city: string;
  github_url?: string;
  linkedin_url?: string;
}) => {
  const { data } = await api.post('/ingest/student/manual', payload);
  return data;
};

/**
 * Upload a resume PDF for the current student.
 * Backend endpoint: POST /ingest/resume  (multipart)
 * Falls back gracefully if not available.
 */
export const uploadResume = async (file: File) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/ingest/resume', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

/**
 * Fetch the activity heatmap for a student.
 * Returns an array of { date: string; count: number } items.
 */
export const getStudentActivity = async (studentId: number): Promise<{ date: string; count: number }[]> => {
  try {
    const { data } = await api.get(`/students/${studentId}/activity`);
    return data;
  } catch {
    // Endpoint may not exist yet — return empty array so UI gracefully shows no activity
    return [];
  }
};

export default api;
