import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Создаем экземпляр axios с базовыми настройками
const api: AxiosInstance = axios.create({
  baseURL: '/api', // Будет проксироваться через React в development
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик для добавления токена авторизации к запросам
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Перехватчик для обновления токена при ошибке авторизации
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 и запрос еще не повторялся
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Пытаемся обновить токен
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {}, {
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          });
          
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          
          // Обновляем токен в оригинальном запросе и повторяем его
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // При ошибке обновления токена - выход из системы
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Типизированные методы для работы с API
export const apiService = {
  // Авторизация и пользователи
  auth: {
    login: (data: { email: string; password: string }) => 
      api.post('/auth/login', data),
    
    register: (data: { email: string; password: string; name: string; role?: string; phone?: string }) => 
      api.post('/auth/register', data),
    
    refresh: () => 
      api.post('/auth/refresh'),
      
    getProfile: () => 
      api.get('/users/profile'),
    
    updateProfile: (data: any) => 
      api.put('/users/profile', data),
    
    getUsers: () => 
      api.get('/users'),
    
    getUser: (id: number) => 
      api.get(`/users/${id}`),
    
    updateUser: (id: number, data: any) => 
      api.put(`/users/${id}`, data),
  },

  // Товары
  products: {
    getAll: (params?: any) => 
      api.get('/inventory/products', { params }),
    
    get: (id: number) => 
      api.get(`/inventory/products/${id}`),
    
    create: (data: any) => 
      api.post('/inventory/products', data),
    
    update: (id: number, data: any) => 
      api.put(`/inventory/products/${id}`, data),
    
    delete: (id: number) => 
      api.delete(`/inventory/products/${id}`),
    
    getLogs: (id: number) => 
      api.get(`/inventory/products/${id}/inventory_logs`),
    
    getLowStock: () => 
      api.get('/inventory/low_stock'),
  },

  // Категории
  categories: {
    getAll: () => 
      api.get('/inventory/categories'),
    
    get: (id: number) => 
      api.get(`/inventory/categories/${id}`),
    
    create: (data: any) => 
      api.post('/inventory/categories', data),
    
    update: (id: number, data: any) => 
      api.put(`/inventory/categories/${id}`, data),
    
    delete: (id: number) => 
      api.delete(`/inventory/categories/${id}`),
  },

  // Поставщики
  suppliers: {
    getAll: () => 
      api.get('/inventory/suppliers'),
    
    get: (id: number) => 
      api.get(`/inventory/suppliers/${id}`),
    
    create: (data: any) => 
      api.post('/inventory/suppliers', data),
    
    update: (id: number, data: any) => 
      api.put(`/inventory/suppliers/${id}`, data),
    
    delete: (id: number) => 
      api.delete(`/inventory/suppliers/${id}`),
  },

  // Заказы
  orders: {
    getAll: (params?: any) => 
      api.get('/orders', { params }),
    
    get: (id: number) => 
      api.get(`/orders/${id}`),
    
    create: (data: any) => 
      api.post('/orders', data),
    
    updateStatus: (id: number, status: string) => 
      api.put(`/orders/${id}/status`, { status }),
    
    delete: (id: number) => 
      api.delete(`/orders/${id}`),
    
    uploadFile: (id: number, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/orders/${id}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  },

  // Интеграции
  integrations: {
    getDadataAddress: (query: string, count?: number) => 
      api.get(`/integrations/dadata/address`, { params: { query, count } }),
    
    getDadataCompany: (query: string, count?: number) => 
      api.get(`/integrations/dadata/company`, { params: { query, count } }),
  },
};

export default api; 