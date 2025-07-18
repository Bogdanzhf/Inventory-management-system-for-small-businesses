import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api';
import { Category } from '../types/models';
import { RootStore } from './index';

export class CategoryStore {
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  // Загрузка всех категорий
  fetchCategories = async () => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.categories.getAll();
      runInAction(() => {
        this.categories = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки категорий';
        this.isLoading = false;
      });
    }
  };

  // Загрузка одной категории
  fetchCategory = async (id: number) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.categories.get(id);
      runInAction(() => {
        this.selectedCategory = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки категории';
        this.isLoading = false;
      });
    }
  };

  // Создание категории
  createCategory = async (data: Partial<Category>) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.categories.create(data);
      runInAction(() => {
        this.categories.push(response.data);
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Категория успешно создана');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка создания категории';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || 'Ошибка создания категории');
      return false;
    }
  };

  // Обновление категории
  updateCategory = async (id: number, data: Partial<Category>) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.categories.update(id, data);
      runInAction(() => {
        // Обновляем категорию в списке
        const index = this.categories.findIndex(c => c.id === id);
        if (index !== -1) {
          this.categories[index] = response.data;
        }
        
        // Если это выбранная категория, обновляем и её
        if (this.selectedCategory && this.selectedCategory.id === id) {
          this.selectedCategory = response.data;
        }
        
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Категория успешно обновлена');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка обновления категории';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || 'Ошибка обновления категории');
      return false;
    }
  };

  // Удаление категории
  deleteCategory = async (id: number) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      await apiService.categories.delete(id);
      runInAction(() => {
        // Удаляем категорию из списка
        this.categories = this.categories.filter(c => c.id !== id);
        
        // Если это выбранная категория, очищаем её
        if (this.selectedCategory && this.selectedCategory.id === id) {
          this.selectedCategory = null;
        }
        
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Категория успешно удалена');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка удаления категории';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || 'Ошибка удаления категории');
      return false;
    }
  };

  // Получение категории по ID из кэша
  getCategoryById = (id: number): Category | undefined => {
    return this.categories.find(c => c.id === id);
  };

  // Очистка выбранной категории
  clearSelectedCategory = () => {
    this.selectedCategory = null;
  };

  // Сброс ошибки
  clearError = () => {
    this.error = null;
  };
} 