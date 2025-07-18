import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useStores } from './store';
import { useTranslation } from 'react-i18next';

// Импорт компонентов
import Layout from './components/Layout/Layout';
import CustomSnackbar from './components/UI/CustomSnackbar';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import AdminRoute from './components/PrivateRoute/AdminRoute';
import OwnerRoute from './components/PrivateRoute/OwnerRoute';

// Импорт страниц
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import InventoryPage from './pages/Inventory/InventoryPage';
import OrdersPage from './pages/Orders/OrdersPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import SupplierPage from './pages/Suppliers/SupplierPage';
import SettingsPage from './pages/Settings/SettingsPage';
import UserManagementPage from './pages/UserManagement/UserManagementPage';

const App: React.FC = observer(() => {
  const { authStore, uiStore } = useStores();
  const { i18n } = useTranslation();
  
  useEffect(() => {
    // Проверка токена при загрузке приложения
    authStore.checkAuth();
    
    // Применение языковых настроек
    i18n.changeLanguage(uiStore.language);
  }, [authStore, uiStore, i18n]);
  
  return (
    <ThemeProvider theme={uiStore.theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={
          authStore.isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
        } />
        <Route path="/register" element={
          authStore.isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />
        } />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          
          <Route path="dashboard" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
          
          <Route path="inventory" element={
            <PrivateRoute>
              <InventoryPage />
            </PrivateRoute>
          } />
          
          <Route path="orders" element={
            <PrivateRoute>
              <OrdersPage />
            </PrivateRoute>
          } />
          
          <Route path="analytics" element={
            <OwnerRoute>
              <AnalyticsPage />
            </OwnerRoute>
          } />
          
          <Route path="suppliers" element={
            <PrivateRoute>
              <SupplierPage />
            </PrivateRoute>
          } />
          
          <Route path="settings" element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          } />
          
          <Route path="users" element={
            <AdminRoute>
              <UserManagementPage />
            </AdminRoute>
          } />
          
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      
      <CustomSnackbar />
    </ThemeProvider>
  );
});

export default App; 