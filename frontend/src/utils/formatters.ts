/**
 * Утилиты для форматирования данных
 */

/**
 * Форматирование даты
 * @param dateString - Строка с датой
 * @param options - Опции форматирования
 * @returns Отформатированная дата
 */
export const formatDate = (
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }
): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('ru-RU', options);
};

/**
 * Форматирование даты и времени
 * @param dateString - Строка с датой
 * @returns Отформатированная дата и время
 */
export const formatDateTime = (dateString: string | Date): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Форматирование денежной суммы
 * @param amount - Сумма
 * @param currency - Валюта (по умолчанию RUB)
 * @returns Отформатированная сумма
 */
export const formatCurrency = (amount: number, currency: string = 'RUB'): string => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Форматирование числа
 * @param value - Число
 * @param minimumFractionDigits - Минимальное количество десятичных знаков
 * @param maximumFractionDigits - Максимальное количество десятичных знаков
 * @returns Отформатированное число
 */
export const formatNumber = (
  value: number,
  minimumFractionDigits: number = 0,
  maximumFractionDigits: number = 2
): string => {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

/**
 * Форматирование процента
 * @param value - Значение (0-100)
 * @param minimumFractionDigits - Минимальное количество десятичных знаков
 * @param maximumFractionDigits - Максимальное количество десятичных знаков
 * @returns Отформатированный процент
 */
export const formatPercent = (
  value: number,
  minimumFractionDigits: number = 0,
  maximumFractionDigits: number = 1
): string => {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value / 100);
};

/**
 * Форматирование телефонного номера
 * @param phone - Телефонный номер
 * @returns Отформатированный телефонный номер
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, '');
  
  // Форматируем номер в российском формате
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  
  // Если формат не определен, возвращаем исходный номер
  return phone;
};

/**
 * Сокращение текста
 * @param text - Исходный текст
 * @param maxLength - Максимальная длина
 * @returns Сокращенный текст
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return `${text.slice(0, maxLength)}...`;
}; 