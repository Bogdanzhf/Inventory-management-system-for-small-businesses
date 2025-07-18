import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api';
import { Product, ProductFilter } from '../types/models';
import { RootStore } from './index';

export class ProductStore {
  products: Product[] = [];
  selectedProduct: Product | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  filter: ProductFilter = {
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  };
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  // Загрузка всех продуктов
  fetchProducts = async () => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.products.getAll(this.filter);
      runInAction(() => {
        this.products = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки продуктов';
        this.isLoading = false;
      });
    }
  };

  // Загрузка одного продукта
  fetchProduct = async (id: number) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.products.get(id);
      runInAction(() => {
        this.selectedProduct = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки продукта';
        this.isLoading = false;
      });
    }
  };

  // Создание продукта
  createProduct = async (data: Partial<Product>) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.products.create(data);
      runInAction(() => {
        this.products.push(response.data);
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Продукт успешно создан');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка создания продукта';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || '');
      return false;
    }
  };

  // Обновление продукта
  updateProduct = async (id: number, data: Partial<Product>) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.products.update(id, data);
      runInAction(() => {
        // Обновляем продукт в списке
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
          this.products[index] = response.data;
        }
        
        // Если это выбранный продукт, обновляем и его
        if (this.selectedProduct && this.selectedProduct.id === id) {
          this.selectedProduct = response.data;
        }
        
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Продукт успешно обновлен');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка обновления продукта';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || '');
      return false;
    }
  };

  // Удаление продукта
  deleteProduct = async (id: number) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      await apiService.products.delete(id);
      runInAction(() => {
        // Удаляем продукт из списка
        this.products = this.products.filter(p => p.id !== id);
        
        // Если это выбранный продукт, очищаем его
        if (this.selectedProduct && this.selectedProduct.id === id) {
          this.selectedProduct = null;
        }
        
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Продукт успешно удален');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка удаления продукта';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || '');
      return false;
    }
  };

  // Загрузка товаров с низким запасом
  fetchLowStockProducts = async () => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.products.getLowStock();
      runInAction(() => {
        this.products = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки товаров с низким запасом';
        this.isLoading = false;
      });
    }
  };

  // Обновление фильтра и загрузка данных
  setFilter = (filter: Partial<ProductFilter>) => {
    this.filter = { ...this.filter, ...filter };
    this.fetchProducts();
  };

  // Сброс фильтров
  resetFilter = () => {
    this.filter = {
      search: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    };
    this.fetchProducts();
  };

  // Очистка выбранного продукта
  clearSelectedProduct = () => {
    this.selectedProduct = null;
  };

  // Сброс ошибки
  clearError = () => {
    this.error = null;
  };
} 