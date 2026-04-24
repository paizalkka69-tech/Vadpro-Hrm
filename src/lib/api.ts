import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5020';

const api = axios.create({
  baseURL: API_BASE + '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hrms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// DEMO MODE: swallow all API errors silently — no redirect to login, no toast.
// Returns an empty-list / empty-object response so pages render without crashing.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const emptyResponse = {
      data: {
        success: false,
        message: 'Demo mode — backend not connected.',
        data: Array.isArray(error?.config?.params) ? [] : [],
        pagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0, hasPrevious: false, hasNext: false },
      },
    };
    return Promise.resolve(emptyResponse);
  }
);

export default api;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  errors?: string[];
}
