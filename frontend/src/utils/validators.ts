/**
 * Утилиты для валидации данных
 */

/**
 * Проверка, что значение не пустое
 * @param value - Проверяемое значение
 * @returns true, если значение не пустое
 */
export const isNotEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * Проверка валидности email
 * @param email - Email для проверки
 * @returns true, если email валиден
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  
  // Регулярное выражение для проверки email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Проверка валидности пароля
 * @param password - Пароль для проверки
 * @param minLength - Минимальная длина пароля (по умолчанию 8)
 * @returns true, если пароль валиден
 */
export const isValidPassword = (password: string, minLength: number = 8): boolean => {
  if (!password) return false;
  
  // Проверка минимальной длины
  if (password.length < minLength) return false;
  
  // Проверка наличия хотя бы одной цифры
  if (!/\d/.test(password)) return false;
  
  // Проверка наличия хотя бы одной буквы
  if (!/[a-zA-Z]/.test(password)) return false;
  
  return true;
};

/**
 * Проверка валидности телефонного номера
 * @param phone - Телефонный номер для проверки
 * @returns true, если номер валиден
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  
  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, '');
  
  // Проверка для российского номера
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return true;
  }
  
  // Для международного номера минимум 10 цифр
  return digits.length >= 10;
};

/**
 * Проверка валидности ИНН
 * @param inn - ИНН для проверки
 * @returns true, если ИНН валиден
 */
export const isValidInn = (inn: string): boolean => {
  if (!inn) return false;
  
  // Удаляем все нецифровые символы
  const digits = inn.replace(/\D/g, '');
  
  // ИНН может быть только 10 или 12 цифр
  if (digits.length !== 10 && digits.length !== 12) {
    return false;
  }
  
  // Для 10-значного ИНН проверяем контрольную цифру
  if (digits.length === 10) {
    const checkDigit = calculateInnCheckDigit(digits.slice(0, 9));
    return parseInt(digits[9]) === checkDigit;
  }
  
  // Для 12-значного ИНН проверяем две контрольные цифры
  if (digits.length === 12) {
    const checkDigit1 = calculateInnCheckDigit12_1(digits.slice(0, 10));
    const checkDigit2 = calculateInnCheckDigit12_2(digits.slice(0, 11));
    return parseInt(digits[10]) === checkDigit1 && parseInt(digits[11]) === checkDigit2;
  }
  
  return false;
};

/**
 * Расчет контрольной цифры для 10-значного ИНН
 * @param digits - Первые 9 цифр ИНН
 * @returns Контрольная цифра
 */
const calculateInnCheckDigit = (digits: string): number => {
  const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8];
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * weights[i];
  }
  
  return (sum % 11) % 10;
};

/**
 * Расчет первой контрольной цифры для 12-значного ИНН
 * @param digits - Первые 10 цифр ИНН
 * @returns Первая контрольная цифра
 */
const calculateInnCheckDigit12_1 = (digits: string): number => {
  const weights = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * weights[i];
  }
  
  return (sum % 11) % 10;
};

/**
 * Расчет второй контрольной цифры для 12-значного ИНН
 * @param digits - Первые 11 цифр ИНН
 * @returns Вторая контрольная цифра
 */
const calculateInnCheckDigit12_2 = (digits: string): number => {
  const weights = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
  let sum = 0;
  
  for (let i = 0; i < 11; i++) {
    sum += parseInt(digits[i]) * weights[i];
  }
  
  return (sum % 11) % 10;
};

/**
 * Проверка валидности числа
 * @param value - Значение для проверки
 * @param min - Минимальное допустимое значение
 * @param max - Максимальное допустимое значение
 * @returns true, если значение валидно
 */
export const isValidNumber = (value: any, min?: number, max?: number): boolean => {
  // Проверка, что значение является числом
  const num = Number(value);
  if (isNaN(num)) return false;
  
  // Проверка минимального значения
  if (min !== undefined && num < min) return false;
  
  // Проверка максимального значения
  if (max !== undefined && num > max) return false;
  
  return true;
};

/**
 * Проверка валидности даты
 * @param date - Дата для проверки
 * @param minDate - Минимальная допустимая дата
 * @param maxDate - Максимальная допустимая дата
 * @returns true, если дата валидна
 */
export const isValidDate = (date: any, minDate?: Date, maxDate?: Date): boolean => {
  // Преобразуем в объект Date
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Проверка, что дата валидна
  if (isNaN(dateObj.getTime())) return false;
  
  // Проверка минимальной даты
  if (minDate && dateObj < minDate) return false;
  
  // Проверка максимальной даты
  if (maxDate && dateObj > maxDate) return false;
  
  return true;
}; 