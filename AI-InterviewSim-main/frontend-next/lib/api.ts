import axios from 'axios';
import { supabase } from './supabaseClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach Supabase JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Failed to attach auth header:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`API Error ${error.response.status}:`, error.response.statusText);
      // Handle 401 - redirect to login
      if (error.response.status === 401) {
        console.warn('Authentication required. Please sign in.');
      }
    } else if (error.request) {
      console.error('No response received from API server');
    } else {
      console.error('Request configuration error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const interviewAPI = {
  // Parse resume from PDF
  parseResume: async (formData: FormData) => {
    // Do NOT set Content-Type manually — the browser will set it with the
    // correct multipart boundary automatically. Setting it here strips the
    // boundary and causes the backend to fail parsing the file.
    const response = await api.post('/api/parse-resume', formData);
    return response.data;
  },

  // Start interview session
  startInterview: async (role: string, rounds: number, resumeId?: string) => {
    const response = await api.post('/api/interview/start', { role, rounds, resume_id: resumeId });
    return response.data;
  },

  // Submit answer and get next question
  submitAnswer: async (answer: string, sessionId?: string) => {
    const response = await api.post('/api/interview/answer', { answer, session_id: sessionId });
    return response.data;
  },

  // Get feedback for a specific interview
  getFeedback: async (interviewId: string) => {
    const response = await api.post(`/api/interview/feedback?interview_id=${interviewId}`);
    return response.data;
  },

  // Get interview history
  getHistory: async () => {
    const response = await api.get('/api/interview/history');
    return response.data;
  },

  // Get user stats for dashboard/analytics
  getUserStats: async () => {
    const response = await api.get('/api/user/stats');
    return response.data;
  },

  // Get recent interviews for dashboard
  getRecentInterviews: async (limit: number = 5) => {
    const response = await api.get(`/api/interview/recent?limit=${limit}`);
    return response.data;
  },

  // Get score trends for analytics
  getScoreTrends: async () => {
    const response = await api.get('/api/analytics/trends');
    return response.data;
  },

  // Get weekly activity for analytics
  getWeeklyActivity: async () => {
    const response = await api.get('/api/analytics/weekly');
    return response.data;
  },

  // Billing
  getSubscription: async () => {
    const response = await api.get('/api/billing/subscription');
    return response.data;
  },

  createCheckoutSession: async (priceId?: string) => {
    const response = await api.post('/api/billing/create-checkout-session', { price_id: priceId });
    return response.data;
  },

  createBillingPortal: async () => {
    const response = await api.post('/api/billing/portal');
    return response.data;
  },
};

export default api;
