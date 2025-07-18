import { makeAutoObservable } from 'mobx';
import { RootStore } from './index';
import i18n from 'i18next';
import { lightTheme, darkTheme } from '../utils/theme';
import { Theme } from '@mui/material/styles';

export class UIStore {
  darkMode: boolean;
  language: string;
  sidebarOpen: boolean = true;
  notificationsOpen: boolean = false;
  theme: Theme;
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
    autoHideDuration: number;
  };
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    
    // Загрузка настроек из localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    this.darkMode = savedDarkMode ? JSON.parse(savedDarkMode) : false;
    this.theme = this.darkMode ? darkTheme : lightTheme;
    
    this.language = localStorage.getItem('language') || 'ru';
    
    this.snackbar = {
      open: false,
      message: '',
      severity: 'info',
      autoHideDuration: 3000,
    };
    
    makeAutoObservable(this, { rootStore: false, theme: true });
  }

  // Переключение темной темы
  toggleDarkMode = () => {
    this.darkMode = !this.darkMode;
    this.theme = this.darkMode ? darkTheme : lightTheme;
    localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
  };

  // Изменение языка
  setLanguage = (language: string) => {
    this.language = language;
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  };

  // Переключение боковой панели
  toggleSidebar = () => {
    this.sidebarOpen = !this.sidebarOpen;
  };

  // Открыть боковую панель
  openSidebar = () => {
    this.sidebarOpen = true;
  };

  // Закрыть боковую панель
  closeSidebar = () => {
    this.sidebarOpen = false;
  };

  // Переключение уведомлений
  toggleNotifications = () => {
    this.notificationsOpen = !this.notificationsOpen;
  };

  // Открыть уведомления
  openNotifications = () => {
    this.notificationsOpen = true;
  };

  // Закрыть уведомления
  closeNotifications = () => {
    this.notificationsOpen = false;
  };

  // Показать уведомление
  showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info', autoHideDuration: number = 3000) => {
    this.snackbar = {
      open: true,
      message,
      severity,
      autoHideDuration,
    };
  };

  // Закрыть уведомление
  closeSnackbar = () => {
    this.snackbar.open = false;
  };

  // Показать сообщение об успехе
  showSuccess = (message: string) => {
    this.showSnackbar(message, 'success');
  };

  // Показать сообщение об ошибке
  showError = (message: string) => {
    this.showSnackbar(message, 'error');
  };

  // Показать предупреждение
  showWarning = (message: string) => {
    this.showSnackbar(message, 'warning');
  };

  // Показать информационное сообщение
  showInfo = (message: string) => {
    this.showSnackbar(message, 'info');
  };
} 