// jest-dom добавляет кастомные матчеры для Jest для утверждений на DOM-узлах.
// Это позволяет делать такие вещи, как:
// expect(element).toHaveTextContent(/react/i)
import '@testing-library/jest-dom';

// Настройка для MobX
import { configure } from 'mobx';

configure({
  enforceActions: 'never',
});

// Мокаем localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Мокаем sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Мокаем matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // устаревший
    removeListener: jest.fn(), // устаревший
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Глобальный мок для fetch
global.fetch = jest.fn();

// Очистка всех моков после каждого теста
afterEach(() => {
  jest.clearAllMocks();
}); 