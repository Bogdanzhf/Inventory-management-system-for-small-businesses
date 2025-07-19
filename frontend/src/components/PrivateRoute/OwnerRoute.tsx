import React from 'react';
import { Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { useAuthStore } from '../../store';

interface OwnerRouteProps {
  children: React.ReactNode;
}

const OwnerRoute: React.FC<OwnerRouteProps> = ({ children }) => {
  const authStore = useAuthStore();
  const { isAuthenticated, isLoading, user } = authStore;

  // Если идет процесс проверки аутентификации, показываем загрузку
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Если пользователь не владелец или администратор, перенаправляем на домашнюю страницу
  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  // Иначе показываем запрошенный компонент
  return <>{children}</>;
};

export default observer(OwnerRoute);
