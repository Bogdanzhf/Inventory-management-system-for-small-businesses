import React, { createContext, useContext } from 'react';
import { AuthStore } from './AuthStore';
import { UIStore } from './UIStore';
import { ProductStore } from './ProductStore';
import { SupplierStore } from './SupplierStore';
import { OrderStore } from './OrderStore';
import { CategoryStore } from './CategoryStore';
import { UserStore } from './UserStore';

export class RootStore {
  authStore: AuthStore;
  uiStore: UIStore;
  productStore: ProductStore;
  supplierStore: SupplierStore;
  orderStore: OrderStore;
  categoryStore: CategoryStore;
  userStore: UserStore;

  constructor() {
    this.authStore = new AuthStore(this);
    this.uiStore = new UIStore(this);
    this.productStore = new ProductStore(this);
    this.supplierStore = new SupplierStore(this);
    this.orderStore = new OrderStore(this);
    this.categoryStore = new CategoryStore(this);
    this.userStore = new UserStore(this);
  }
}

export const rootStore = new RootStore();

export const StoreContext = createContext<RootStore>(rootStore);

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
  return (
    <StoreContext.Provider value={rootStore}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStores = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStores must be used within StoreProvider');
  }
  return context;
};

export const useAuthStore = () => useStores().authStore;
export const useUIStore = () => useStores().uiStore;
export const useProductStore = () => useStores().productStore;
export const useSupplierStore = () => useStores().supplierStore;
export const useOrderStore = () => useStores().orderStore;
export const useCategoryStore = () => useStores().categoryStore;
export const useUserStore = () => useStores().userStore; 