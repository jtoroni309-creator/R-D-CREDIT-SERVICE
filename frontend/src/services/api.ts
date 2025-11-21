import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  initiateShareFileLogin: () => api.get('/auth/sharefile/login'),
  handleCallback: (code: string) =>
    api.get(`/auth/sharefile/callback?code=${code}`),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Engagement Service
export const engagementService = {
  list: (params?: any) => api.get('/engagements', { params }),
  create: (data: any) => api.post('/engagements', data),
  get: (id: string) => api.get(`/engagements/${id}`),
  update: (id: string, data: any) => api.put(`/engagements/${id}`, data),
  delete: (id: string) => api.delete(`/engagements/${id}`),
  getSummary: (id: string) => api.get(`/engagements/${id}/summary`),
  updateStatus: (id: string, status: string) =>
    api.put(`/engagements/${id}/status`, { status }),
};

// Project Service
export const projectService = {
  listByEngagement: (engagementId: string) =>
    api.get(`/projects/engagement/${engagementId}`),
  create: (engagementId: string, data: any) =>
    api.post(`/projects/engagement/${engagementId}`, data),
  get: (id: string) => api.get(`/projects/${id}`),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  validate4Part: (id: string) => api.post(`/projects/${id}/validate-4part`),
};

// QRE Service
export const qreService = {
  // Wages
  listWages: (engagementId: string) =>
    api.get(`/qre/engagement/${engagementId}/wages`),
  createWage: (engagementId: string, data: any) =>
    api.post(`/qre/engagement/${engagementId}/wages`, data),
  updateWage: (id: string, data: any) => api.put(`/qre/wages/${id}`, data),
  deleteWage: (id: string) => api.delete(`/qre/wages/${id}`),

  // Supplies
  listSupplies: (engagementId: string) =>
    api.get(`/qre/engagement/${engagementId}/supplies`),
  createSupply: (engagementId: string, data: any) =>
    api.post(`/qre/engagement/${engagementId}/supplies`, data),
  updateSupply: (id: string, data: any) => api.put(`/qre/supplies/${id}`, data),
  deleteSupply: (id: string) => api.delete(`/qre/supplies/${id}`),

  // Contracts
  listContracts: (engagementId: string) =>
    api.get(`/qre/engagement/${engagementId}/contracts`),
  createContract: (engagementId: string, data: any) =>
    api.post(`/qre/engagement/${engagementId}/contracts`, data),
  updateContract: (id: string, data: any) =>
    api.put(`/qre/contracts/${id}`, data),
  deleteContract: (id: string) => api.delete(`/qre/contracts/${id}`),
};

// Calculation Service
export const calculationService = {
  calculate: (engagementId: string) =>
    api.post(`/calculations/engagement/${engagementId}/calculate`),
  getLatest: (engagementId: string) =>
    api.get(`/calculations/engagement/${engagementId}/latest`),
};

// LLM Service
export const llmService = {
  improveNarrative: (text: string) =>
    api.post('/llm/improve-narrative', { text }),
  expandTechnical: (text: string) => api.post('/llm/expand-technical', { text }),
  suggestMissing: (projectData: any) =>
    api.post('/llm/suggest-missing', { projectData }),
};

// Report Service
export const reportService = {
  generatePDF: (engagementId: string, options?: any) =>
    api.post(`/reports/engagement/${engagementId}/generate-pdf`, options, {
      responseType: 'blob',
    }),
  exportForm6765JSON: (engagementId: string) =>
    api.post(`/reports/engagement/${engagementId}/form6765/json`, null, {
      responseType: 'blob',
    }),
  exportForm6765CSV: (engagementId: string) =>
    api.post(`/reports/engagement/${engagementId}/form6765/csv`, null, {
      responseType: 'blob',
    }),
  exportForm6765Excel: (engagementId: string) =>
    api.post(`/reports/engagement/${engagementId}/form6765/excel`, null, {
      responseType: 'blob',
    }),
};

export default api;
