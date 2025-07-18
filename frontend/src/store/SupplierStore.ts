import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api';
import { Supplier } from '../types/models';
import { RootStore } from './index';

export class SupplierStore {
  suppliers: Supplier[] = [];
  selectedSupplier: Supplier | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  // Загрузка всех поставщиков
  fetchSuppliers = async () => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.suppliers.getAll();
      runInAction(() => {
        this.suppliers = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки поставщиков';
        this.isLoading = false;
      });
    }
  };

  // Загрузка одного поставщика
  fetchSupplier = async (id: number) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.suppliers.get(id);
      runInAction(() => {
        this.selectedSupplier = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки поставщика';
        this.isLoading = false;
      });
    }
  };

  // Создание поставщика
  createSupplier = async (data: Partial<Supplier>) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.suppliers.create(data);
      runInAction(() => {
        this.suppliers.push(response.data);
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Поставщик успешно создан');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка создания поставщика';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || '');
      return false;
    }
  };

  // Обновление поставщика
  updateSupplier = async (id: number, data: Partial<Supplier>) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.suppliers.update(id, data);
      runInAction(() => {
        // Обновляем поставщика в списке
        const index = this.suppliers.findIndex(s => s.id === id);
        if (index !== -1) {
          this.suppliers[index] = response.data;
        }
        
        // Если это выбранный поставщик, обновляем и его
        if (this.selectedSupplier && this.selectedSupplier.id === id) {
          this.selectedSupplier = response.data;
        }
        
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Поставщик успешно обновлен');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка обновления поставщика';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || '');
      return false;
    }
  };

  // Удаление поставщика
  deleteSupplier = async (id: number) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      await apiService.suppliers.delete(id);
      runInAction(() => {
        // Удаляем поставщика из списка
        this.suppliers = this.suppliers.filter(s => s.id !== id);
        
        // Если это выбранный поставщик, очищаем его
        if (this.selectedSupplier && this.selectedSupplier.id === id) {
          this.selectedSupplier = null;
        }
        
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Поставщик успешно удален');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка удаления поставщика';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || '');
      return false;
    }
  };

  // Получение поставщика по ID из кэша
  getSupplierById = (id: number): Supplier | undefined => {
    return this.suppliers.find(s => s.id === id);
  };

  // Очистка выбранного поставщика
  clearSelectedSupplier = () => {
    this.selectedSupplier = null;
  };

  // Сброс ошибки
  clearError = () => {
    this.error = null;
  };
} 