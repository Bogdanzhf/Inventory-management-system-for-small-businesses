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
      const response = await apiService.auth.register(data);
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
        this.error = error.response?.data?.message || 'Ошибка регистрации';
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