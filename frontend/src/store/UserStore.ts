import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api';
import { User } from '../types/models';
import { RootStore } from './index';

export class UserStore {
  users: User[] = [];
  selectedUser: User | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  // Загрузка всех пользователей (только для админа)
  fetchUsers = async () => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.auth.getUsers();
      runInAction(() => {
        this.users = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки пользователей';
        this.isLoading = false;
      });
    }
  };

  // Загрузка одного пользователя
  fetchUser = async (id: number) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.auth.getUser(id);
      runInAction(() => {
        this.selectedUser = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки пользователя';
        this.isLoading = false;
      });
    }
  };

  // Обновление пользователя (админом)
  updateUser = async (id: number, data: Partial<User>) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.auth.updateUser(id, data);
      runInAction(() => {
        // Обновляем пользователя в списке
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
          this.users[index] = response.data;
        }
        
        // Если это выбранный пользователь, обновляем и его
        if (this.selectedUser && this.selectedUser.id === id) {
          this.selectedUser = response.data;
        }
        
        // Если это текущий пользователь, обновляем профиль в AuthStore
        const currentUser = this.rootStore.authStore.user;
        if (currentUser && currentUser.id === id) {
          this.rootStore.authStore.user = response.data;
        }
        
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Пользователь успешно обновлен');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка обновления пользователя';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || 'Ошибка обновления пользователя');
      return false;
    }
  };

  // Активация/деактивация пользователя
  toggleUserActive = async (id: number, isActive: boolean) => {
    return this.updateUser(id, { is_active: isActive });
  };

  // Получение пользователя по ID из кэша
  getUserById = (id: number): User | undefined => {
    return this.users.find(u => u.id === id);
  };

  // Очистка выбранного пользователя
  clearSelectedUser = () => {
    this.selectedUser = null;
  };

  // Сброс ошибки
  clearError = () => {
    this.error = null;
  };
} 