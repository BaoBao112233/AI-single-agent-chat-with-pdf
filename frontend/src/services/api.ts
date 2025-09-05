import axios, { AxiosError } from 'axios';
import { ChatRequest, ChatResponse, UploadResponse, APIError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error: AxiosError) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    
    const errorData = error.response?.data as any;
    const apiError: APIError = {
      message: errorData?.detail || error.message || 'An unexpected error occurred',
      status: error.response?.status,
    };
    
    return Promise.reject(apiError);
  }
);

export const chatAPI = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await api.post<ChatResponse>('/ai/chat', request);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async uploadPDF(sessionId: number, userId: number, file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('session_id', sessionId.toString());
      formData.append('user_id', userId.toString());

      const response = await api.post<UploadResponse>('/upload/pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Longer timeout for file upload
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }
  },

  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },
};

export default api;
