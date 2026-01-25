// API Client for Course Management System

// TODO: Remove hardcoded URL after setting environment variable in Vercel
const API_BASE_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://course-management-api-ltw3.onrender.com/api/v1')
  : 'https://course-management-api-ltw3.onrender.com/api/v1';

// Debug: Log API base URL (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔗 API Base URL:', API_BASE_URL);
  console.log('📝 Environment Variable:', process.env.NEXT_PUBLIC_API_URL || 'NOT SET (using fallback)');
}

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

// Get auth token from localStorage
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

// API request wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Construct full URL
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    // Debug logging (only in development)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('🌐 API Request:', options.method || 'GET', fullUrl);
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if response is ok before trying to parse JSON
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, create error object
      data = { 
        error: response.statusText || 'An error occurred',
        message: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401) {
        // Try to refresh token
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const refreshController = new AbortController();
              const refreshTimeout = setTimeout(() => refreshController.abort(), 5000);
              
              const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
                signal: refreshController.signal,
              });
              
              clearTimeout(refreshTimeout);
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('accessToken', refreshData.data.accessToken);
                localStorage.setItem('refreshToken', refreshData.data.refreshToken);
                
                // Retry original request
                return apiRequest<T>(endpoint, options);
              }
            } catch (error) {
              // Refresh failed, redirect to login
              if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/sign-in';
              }
            }
          } else {
            // No refresh token, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/sign-in';
          }
        }
      }
      
      // If validation error, include details
      if (data.details && Array.isArray(data.details)) {
        const detailsMessage = data.details.map((d: any) => `${d.path}: ${d.message}`).join(', ');
        throw new Error(`${data.message || data.error || 'Validation Error'}: ${detailsMessage}`);
      }
      
      throw new Error(data.message || data.error || 'An error occurred');
    }

    return data;
  } catch (error: any) {
    // Handle abort errors (timeout)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check if the backend server is running');
    }
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error - cannot reach the backend server. Is it running on port 5000?');
    }
    throw error;
  }
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    return apiRequest<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  register: async (data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'instructor' | 'trainee';
    phone?: string;
    address?: string;
    organizationId?: string;
    departmentId?: string;
    employeeId?: string;
    position?: string;
  }) => {
    return apiRequest<{ user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getMe: async () => {
    return apiRequest<any>('/auth/me');
  },
  
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },
};

// Users API
export const usersApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; role?: string; organizationId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId);
    
    return apiRequest<any[]>(`/users?${queryParams.toString()}`);
  },
  
  getById: async (id: string) => {
    return apiRequest<any>(`/users/${id}`);
  },
  
  create: async (data: any) => {
    return apiRequest<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: string, data: any) => {
    return apiRequest<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },
  
  getCourses: async (id: string) => {
    return apiRequest<any[]>(`/users/${id}/courses`);
  },
  
  getProgress: async (id: string) => {
    return apiRequest<any[]>(`/users/${id}/progress`);
  },
  
  getCertificates: async (id: string) => {
    return apiRequest<any[]>(`/users/${id}/certificates`);
  },
  
  activate: async (id: string) => {
    return apiRequest<any>(`/users/${id}/activate`, {
      method: 'PUT',
    });
  },
  
  deactivate: async (id: string) => {
    return apiRequest<any>(`/users/${id}/deactivate`, {
      method: 'PUT',
    });
  },
};

// Organizations API
export const organizationsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    return apiRequest<any[]>(`/organizations?${queryParams.toString()}`);
  },
  
  getById: async (id: string) => {
    return apiRequest<any>(`/organizations/${id}`);
  },
  
  create: async (data: any) => {
    return apiRequest<any>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: string, data: any) => {
    return apiRequest<any>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/organizations/${id}`, {
      method: 'DELETE',
    });
  },
};

// Departments API
export const departmentsApi = {
  getAll: async (params?: { page?: number; limit?: number; organizationId?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId);
    if (params?.search) queryParams.append('search', params.search);
    
    return apiRequest<any[]>(`/departments?${queryParams.toString()}`);
  },
  
  getById: async (id: string) => {
    return apiRequest<any>(`/departments/${id}`);
  },
  
  create: async (data: any) => {
    return apiRequest<any>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: string, data: any) => {
    return apiRequest<any>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/departments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Courses API
export const coursesApi = {
  getAll: async (params?: { page?: number; limit?: number; organizationId?: string; departmentId?: string; instructorId?: string; status?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.instructorId) queryParams.append('instructorId', params.instructorId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    return apiRequest<any[]>(`/courses?${queryParams.toString()}`);
  },
  
  getPublic: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    return apiRequest<any[]>(`/courses/public?${queryParams.toString()}`);
  },
  
  getById: async (id: string) => {
    return apiRequest<any>(`/courses/${id}`);
  },
  
  create: async (data: any) => {
    return apiRequest<any>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: string, data: any) => {
    return apiRequest<any>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/courses/${id}`, {
      method: 'DELETE',
    });
  },
  
  publish: async (id: string) => {
    return apiRequest<any>(`/courses/${id}/publish`, {
      method: 'PUT',
    });
  },
  
  unpublish: async (id: string) => {
    return apiRequest<any>(`/courses/${id}/unpublish`, {
      method: 'PUT',
    });
  },
  
  enroll: async (id: string, dueDate?: string) => {
    return apiRequest<any>(`/courses/${id}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ dueDate }),
    });
  },
};

// Modules API
export const modulesApi = {
  getByCourse: async (courseId: string) => {
    return apiRequest<any[]>(`/modules?courseId=${courseId}`);
  },
  
  getById: async (id: string) => {
    return apiRequest<any>(`/modules/${id}`);
  },
  
  create: async (data: any) => {
    return apiRequest<any>('/modules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: string, data: any) => {
    return apiRequest<any>(`/modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/modules/${id}`, {
      method: 'DELETE',
    });
  },
};

// Contents API
export const contentsApi = {
  getByModule: async (moduleId: string) => {
    return apiRequest<any[]>(`/contents/modules/${moduleId}`);
  },
  
  getById: async (id: string) => {
    return apiRequest<any>(`/contents/${id}`);
  },
  
  create: async (data: any) => {
    return apiRequest<any>('/contents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: string, data: any) => {
    return apiRequest<any>(`/contents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/contents/${id}`, {
      method: 'DELETE',
    });
  },

  // Upload file (video, document) for content
  uploadFile: async (file: File): Promise<ApiResponse<{ url: string; path: string; filename: string; originalName: string; mimetype: string; size: number }>> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type - let browser set it with boundary for multipart/form-data

    const response = await fetch(`${API_BASE_URL}/contents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      data = { 
        error: response.statusText || 'An error occurred',
        message: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/sign-in';
        }
      }
      
      if (data.details && Array.isArray(data.details)) {
        const detailsMessage = data.details.map((d: any) => `${d.path}: ${d.message}`).join(', ');
        throw new Error(`${data.message || data.error || 'Validation Error'}: ${detailsMessage}`);
      }
      
      throw new Error(data.message || data.error || 'File upload failed');
    }

    return data;
  },
};

// Enrollments API
export const enrollmentsApi = {
  getAll: async (params?: { page?: number; limit?: number; courseId?: string; traineeId?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.courseId) queryParams.append('courseId', params.courseId);
    if (params?.traineeId) queryParams.append('traineeId', params.traineeId);
    if (params?.status) queryParams.append('status', params.status);
    
    return apiRequest<any[]>(`/enrollments?${queryParams.toString()}`);
  },
  
  getById: async (id: string) => {
    return apiRequest<any>(`/enrollments/${id}`);
  },
  
  create: async (data: any) => {
    return apiRequest<any>('/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: string, data: any) => {
    return apiRequest<any>(`/enrollments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  complete: async (id: string) => {
    return apiRequest<any>(`/enrollments/${id}/complete`, {
      method: 'PUT',
    });
  },
  
  drop: async (id: string) => {
    return apiRequest<any>(`/enrollments/${id}/drop`, {
      method: 'PUT',
    });
  },
};

// Progress API
export const progressApi = {
  getByEnrollment: async (enrollmentId: string, moduleId?: string) => {
    const queryParams = new URLSearchParams();
    if (moduleId) queryParams.append('moduleId', moduleId);
    
    return apiRequest<any[]>(`/progress/enrollment/${enrollmentId}?${queryParams.toString()}`);
  },
  
  update: async (data: any) => {
    return apiRequest<any>('/progress', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  completeContent: async (data: any) => {
    return apiRequest<any>('/progress/complete-content', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getCourseProgress: async (courseId: string) => {
    return apiRequest<any>(`/progress/course/${courseId}`);
  },
};

// Assessments API
export const assessmentsApi = {
  getAll: async (params?: { page?: number; limit?: number; courseId?: string; moduleId?: string; type?: 'quiz' | 'assignment' | 'exam'; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.courseId) queryParams.append('courseId', params.courseId);
    if (params?.moduleId) queryParams.append('moduleId', params.moduleId);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    
    return apiRequest<any[]>(`/assessments?${queryParams.toString()}`);
  },
  
  getById: async (id: string) => {
    return apiRequest<any>(`/assessments/${id}`);
  },
  
  create: async (data: any) => {
    return apiRequest<any>('/assessments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: string, data: any) => {
    return apiRequest<any>(`/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/assessments/${id}`, {
      method: 'DELETE',
    });
  },
  
  submit: async (data: { assessmentId: string; enrollmentId: string; answers: Record<string, number | number[]>; timeTaken?: number }) => {
    return apiRequest<any>('/assessments/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getAttempts: async (params?: { page?: number; limit?: number; assessmentId?: string; enrollmentId?: string; traineeId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.assessmentId) queryParams.append('assessmentId', params.assessmentId);
    if (params?.enrollmentId) queryParams.append('enrollmentId', params.enrollmentId);
    if (params?.traineeId) queryParams.append('traineeId', params.traineeId);
    
    return apiRequest<any[]>(`/assessments/attempts?${queryParams.toString()}`);
  },
  
  getAttemptById: async (id: string) => {
    return apiRequest<any>(`/assessments/attempts/${id}`);
  },
};

// AI API
export const aiApi = {
  testConnection: async () => {
    return apiRequest<any>('/ai/test');
  },

  generateQuiz: async (file: File, options?: {
    numQuestions?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionTypes?: ('multiple-choice' | 'true-false' | 'multiple-select')[];
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.numQuestions) {
      formData.append('numQuestions', options.numQuestions.toString());
    }
    if (options?.difficulty) {
      formData.append('difficulty', options.difficulty);
    }
    if (options?.questionTypes) {
      formData.append('questionTypes', JSON.stringify(options.questionTypes));
    }

    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for AI

    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-quiz`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        data = { 
          error: response.statusText || 'An error occurred',
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/sign-in';
          }
        }
        
        if (data.details && Array.isArray(data.details)) {
          const detailsMessage = data.details.map((d: any) => `${d.path}: ${d.message}`).join(', ');
          throw new Error(`${data.message || data.error || 'Validation Error'}: ${detailsMessage}`);
        }
        
        throw new Error(data.message || data.error || 'An error occurred');
      }

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - AI generation is taking too long');
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error - cannot reach the backend server');
      }
      throw error;
    }
  },

  summarize: async (text: string, options?: {
    length?: 'short' | 'medium' | 'long';
    focus?: 'key-points' | 'detailed' | 'bullet-points';
  }) => {
    return apiRequest<{ summary: string }>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({
        text,
        ...options,
      }),
    });
  },

  chat: async (question: string, courseContext: {
    courseId: string;
    courseTitle: string;
    courseDescription?: string;
    modules?: Array<{ title: string; description?: string }>;
  }, history?: Array<{ role: 'user' | 'assistant'; content: string }>) => {
    return apiRequest<{ answer: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        question,
        ...courseContext,
        history: history || [],
      }),
    });
  },
};

// Assignments API
export const assignmentsApi = {
  getAll: async (params?: { page?: number; limit?: number; courseId?: string; moduleId?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.courseId) queryParams.append('courseId', params.courseId);
    if (params?.moduleId) queryParams.append('moduleId', params.moduleId);
    if (params?.search) queryParams.append('search', params.search);
    
    return apiRequest<any[]>(`/assignments?${queryParams.toString()}`);
  },
  
  getById: async (id: string) => {
    return apiRequest<any>(`/assignments/${id}`);
  },
  
  create: async (data: any) => {
    return apiRequest<any>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: string, data: any) => {
    return apiRequest<any>(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/assignments/${id}`, {
      method: 'DELETE',
    });
  },
  
  getAllSubmissions: async (params?: { page?: number; limit?: number; assignmentId?: string; enrollmentId?: string; traineeId?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.assignmentId) queryParams.append('assignmentId', params.assignmentId);
    if (params?.enrollmentId) queryParams.append('enrollmentId', params.enrollmentId);
    if (params?.traineeId) queryParams.append('traineeId', params.traineeId);
    if (params?.status) queryParams.append('status', params.status);
    
    return apiRequest<any[]>(`/assignments/submissions?${queryParams.toString()}`);
  },
  
  getSubmissionById: async (id: string) => {
    return apiRequest<any>(`/assignments/submissions/${id}`);
  },
  
  submit: async (data: any) => {
    return apiRequest<any>('/assignments/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  grade: async (id: string, data: any) => {
    return apiRequest<any>(`/assignments/submissions/${id}/grade`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
