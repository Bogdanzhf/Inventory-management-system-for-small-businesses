import { useNavigate } from 'react-router-dom';
import { useStores } from '../store';

/**
 * Хук для работы с авторизацией пользователя
 */
export const useAuth = () => {
  const { authStore, uiStore } = useStores();
  const navigate = useNavigate();

  /**
   * Вход в систему
   * @param email - Email пользователя
   * @param password - Пароль пользователя
   * @param redirectTo - Путь для перенаправления после успешного входа
   */
  const login = async (email: string, password: string, redirectTo: string = '/dashboard') => {
    try {
      await authStore.login({ email, password });
      uiStore.showSnackbar('Вход выполнен успешно', 'success');
      navigate(redirectTo);
      return true;
    } catch (error) {
      console.error('Ошибка входа:', error);
      uiStore.showSnackbar('Ошибка входа. Проверьте email и пароль', 'error');
      return false;
    }
  };

  /**
   * Регистрация нового пользователя
   * @param email - Email пользователя
   * @param password - Пароль пользователя
   * @param fullName - Полное имя пользователя
   * @param redirectTo - Путь для перенаправления после успешной регистрации
   */
  const register = async (
    email: string,
    password: string,
    fullName: string,
    redirectTo: string = '/login'
  ) => {
    try {
      await authStore.register({ email, password, name: fullName });
      uiStore.showSnackbar('Регистрация выполнена успешно', 'success');
      navigate(redirectTo);
      return true;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      uiStore.showSnackbar('Ошибка регистрации. Попробуйте еще раз', 'error');
      return false;
    }
  };

  /**
   * Выход из системы
   * @param redirectTo - Путь для перенаправления после выхода
   */
  const logout = (redirectTo: string = '/login') => {
    authStore.logout();
    uiStore.showSnackbar('Выход выполнен успешно', 'success');
    navigate(redirectTo);
  };

  /**
   * Проверка авторизации пользователя
   */
  const checkAuth = () => {
    return authStore.isAuthenticated;
  };

  /**
   * Проверка роли пользователя
   * @param role - Роль для проверки
   */
  const hasRole = (role: string) => {
    return authStore.user?.role === role;
  };

  /**
   * Проверка, является ли пользователь администратором
   */
  const isAdmin = () => {
    return hasRole('admin');
  };

  /**
   * Проверка, является ли пользователь владельцем
   */
  const isOwner = () => {
    return hasRole('owner') || isAdmin();
  };

  /**
   * Проверка, является ли пользователь сотрудником
   */
  const isEmployee = () => {
    return hasRole('employee') || isOwner();
  };

  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    login,
    register,
    logout,
    checkAuth,
    hasRole,
    isAdmin,
    isOwner,
    isEmployee,
  };
};
