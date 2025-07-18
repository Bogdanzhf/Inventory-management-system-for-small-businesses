import React from 'react';
import { Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { useAuthStore } from '../../store';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const authStore = useAuthStore();
  const { isAuthenticated, isLoading } = authStore;

  // Если идет процесс проверки аутентификации, показываем загрузку
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Иначе показываем запрошенный компонент
  return <>{children}</>;
};

export default observer(PrivateRoute); 