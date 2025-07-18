import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api';
import { Order, OrderFilter, OrderStatus, OrderCreateData } from '../types/models';
import { RootStore } from './index';

export class OrderStore {
  orders: Order[] = [];
  selectedOrder: Order | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  filter: OrderFilter = {};
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  // Загрузка всех заказов
  fetchOrders = async () => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.orders.getAll(this.filter);
      runInAction(() => {
        this.orders = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки заказов';
        this.isLoading = false;
      });
    }
  };

  // Загрузка одного заказа
  fetchOrder = async (id: number) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.orders.get(id);
      runInAction(() => {
        this.selectedOrder = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки заказа';
        this.isLoading = false;
      });
    }
  };

  // Создание заказа
  createOrder = async (data: OrderCreateData) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.orders.create(data);
      runInAction(() => {
        this.orders.push(response.data);
        this.selectedOrder = response.data;
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Заказ успешно создан');
      return response.data.id;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка создания заказа';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || '');
      return null;
    }
  };

  // Обновление статуса заказа
  updateOrderStatus = async (id: number, status: OrderStatus) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.orders.updateStatus(id, status);
      runInAction(() => {
        // Обновляем заказ в списке
        const index = this.orders.findIndex(o => o.id === id);
        if (index !== -1) {
          this.orders[index] = response.data;
        }
        
        // Если это выбранный заказ, обновляем и его
        if (this.selectedOrder && this.selectedOrder.id === id) {
          this.selectedOrder = response.data;
        }
        
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Статус заказа успешно обновлен');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка обновления статуса заказа';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || '');
      return false;
    }
  };

  // Удаление заказа
  deleteOrder = async (id: number) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      await apiService.orders.delete(id);
      runInAction(() => {
        // Удаляем заказ из списка
        this.orders = this.orders.filter(o => o.id !== id);
        
        // Если это выбранный заказ, очищаем его
        if (this.selectedOrder && this.selectedOrder.id === id) {
          this.selectedOrder = null;
        }
        
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Заказ успешно удален');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка удаления заказа';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || '');
      return false;
    }
  };

  // Загрузка файла к заказу
  uploadFile = async (orderId: number, file: File) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await apiService.orders.uploadFile(orderId, file);
      
      runInAction(() => {
        // Если это выбранный заказ, обновляем его с новым файлом
        if (this.selectedOrder && this.selectedOrder.id === orderId) {
          if (!this.selectedOrder.files) {
            this.selectedOrder.files = [];
          }
          this.selectedOrder.files.push(response.data);
        }
        
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showSuccess('Файл успешно загружен');
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка загрузки файла';
        this.isLoading = false;
      });
      
      this.rootStore.uiStore.showError(this.error || '');
      return false;
    }
  };

  // Обновление фильтра и загрузка данных
  setFilter = (filter: Partial<OrderFilter>) => {
    this.filter = { ...this.filter, ...filter };
    this.fetchOrders();
  };

  // Сброс фильтров
  resetFilter = () => {
    this.filter = {};
    this.fetchOrders();
  };

  // Очистка выбранного заказа
  clearSelectedOrder = () => {
    this.selectedOrder = null;
  };

  // Сброс ошибки
  clearError = () => {
    this.error = null;
  };
} 