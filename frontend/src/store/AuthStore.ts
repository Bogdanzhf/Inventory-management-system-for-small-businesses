import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api';
import { Auth, User, LoginData, RegisterData } from '../types/models';
import { RootStore } from './index';

export class AuthStore {
  isAuthenticated: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;
  user: User | null = null;
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  // Проверка токена при инициализации
  checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    
    if (token) {
      this.isLoading = true;
      try {
        const response = await apiService.auth.getProfile();
        runInAction(() => {
          this.user = response.data;
          this.isAuthenticated = true;
          this.isLoading = false;
        });
      } catch (error) {
        runInAction(() => {
          this.logout();
          this.isLoading = false;
        });
      }
    }
  };

  // Вход пользователя
  login = async (data: LoginData) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.auth.login(data);
      const authData: Auth = response.data;
      
      runInAction(() => {
        this.isAuthenticated = true;
        this.user = authData.user;
        this.isLoading = false;
      });
      
      // Сохраняем токены в localStorage
      localStorage.setItem('access_token', authData.access_token);
      localStorage.setItem('refresh_token', authData.refresh_token);
      
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.isAuthenticated = false;
        this.error = error.response?.data?.message || 'Ошибка входа';
        this.isLoading = false;
      });
      
      return false;
    }
  };

  // Регистрация нового пользователя
  register = async (data: RegisterData) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      console.log('Отправка данных регистрации:', data);
      const response = await apiService.auth.register(data);
      console.log('Ответ от сервера после регистрации:', response.data);
      const authData: Auth = response.data;
      
      runInAction(() => {
        this.isAuthenticated = true;
        this.user = authData.user;
        this.isLoading = false;
      });
      
      // Сохраняем токены в localStorage
      localStorage.setItem('access_token', authData.access_token);
      localStorage.setItem('refresh_token', authData.refresh_token);
      
      return true;
    } catch (error: any) {
      console.error('Ошибка при регистрации:', error);
      let errorMessage = 'Ошибка регистрации';
      
      if (error.response) {
        // Получаем сообщение об ошибке с сервера
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        // Если есть ошибки валидации
        if (error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors;
          const errorMessages = Object.values(errors).flat();
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join(', ');
          }
        }
        
        console.error('Детали ошибки:', error.response.data);
      } else if (error.request) {
        errorMessage = 'Нет ответа от сервера. Проверьте подключение к интернету.';
        console.error('Нет ответа:', error.request);
      } else {
        console.error('Ошибка запроса:', error.message);
      }
      
      runInAction(() => {
        this.isAuthenticated = false;
        this.error = errorMessage;
        this.isLoading = false;
      });
      
      return false;
    }
  };

  // Выход из системы
  logout = () => {
    this.isAuthenticated = false;
    this.user = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  // Обновление данных профиля
  updateProfile = async (data: Partial<User>) => {
    this.isLoading = true;
    
    try {
      const response = await apiService.auth.updateProfile(data);
      runInAction(() => {
        this.user = response.data.user;
        this.isLoading = false;
      });
      
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка обновления профиля';
        this.isLoading = false;
      });
      
      return false;
    }
  };

  // Проверка роли пользователя
  hasRole = (role: string | string[]): boolean => {
    if (!this.user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(this.user.role);
    }
    
    return this.user.role === role;
  };

  // Сброс ошибки
  clearError = () => {
    this.error = null;
  };
} 