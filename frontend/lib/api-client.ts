import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          // Token expired - attempt refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });
              localStorage.setItem('accessToken', data.accessToken);
              // Retry original request
              error.config.headers.Authorization = `Bearer ${data.accessToken}`;
              return this.client.request(error.config);
            } catch (refreshError) {
              // Refresh failed - logout
              localStorage.clear();
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    return data;
  }

  async register(email: string, password: string, userType: string) {
    const { data } = await this.client.post('/auth/register', { email, password, userType });
    return data;
  }

  // Jobs
  async getJobs(params?: any) {
    const { data } = await this.client.get('/jobs', { params });
    return data;
  }

  async getJob(id: number) {
    const { data } = await this.client.get(`/jobs/${id}`);
    return data;
  }

  async createJob(jobData: any) {
    const { data } = await this.client.post('/jobs', jobData);
    return data;
  }

  // Applications
  async applyToJob(jobId: number, resumeId: number, coverLetter?: string) {
    const { data } = await this.client.post('/applications', { jobId, resumeId, coverLetter });
    return data;
  }

  async getApplications(params?: any) {
    const { data } = await this.client.get('/applications', { params });
    return data;
  }

  async updateApplication(id: number, updateData: any) {
    const { data } = await this.client.put(`/applications/${id}`, updateData);
    return data;
  }

  // Admin
  async getAdminDashboard() {
    const { data } = await this.client.get('/admin/dashboard');
    return data;
  }
}

export const apiClient = new ApiClient();
