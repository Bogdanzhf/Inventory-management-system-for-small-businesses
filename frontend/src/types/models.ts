// Базовый интерфейс для моделей с общими полями
export interface BaseModel {
  id: number;
  created_at: string;
  updated_at: string;
}

// Роли пользователей
export enum UserRole {
  ADMIN = "admin",
  OWNER = "owner",
  EMPLOYEE = "employee",
}

// Модель пользователя
export interface User extends BaseModel {
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
}

// Модель для аутентификации
export interface Auth {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Модель для входа
export interface LoginData {
  email: string;
  password: string;
}

// Модель для регистрации
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  phone?: string;
}

// Категории товаров
export interface Category extends BaseModel {
  name: string;
  description?: string;
}

// Поставщики
export interface Supplier extends BaseModel {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
}

// Товары
export interface Product extends BaseModel {
  name: string;
  sku: string;
  description?: string;
  price: number;
  quantity: number;
  min_stock: number;
  category_id?: number;
  supplier_id?: number;
  category?: Category;
  supplier?: Supplier;
  is_low_stock?: boolean;
  qrcode_base64?: string;
}

// История изменения запасов
export interface InventoryLog extends BaseModel {
  product_id: number;
  user_id: number;
  quantity_change: number;
  comment?: string;
  product?: Product;
  user?: User;
}

// Статусы заказов
export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

// Элементы заказа
export interface OrderItem extends BaseModel {
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product?: Product;
  total_price?: number;
}

// Файлы заказа
export interface OrderFile extends BaseModel {
  order_id: number;
  filename: string;
  file_path: string;
  file_type?: string;
  upload_date: string;
}

// Заказы
export interface Order extends BaseModel {
  order_number: string;
  user_id: number;
  supplier_id: number;
  status: OrderStatus;
  total_amount: number;
  shipping_address?: string;
  notes?: string;
  expected_delivery_date?: string;
  user?: User;
  supplier?: Supplier;
  items?: OrderItem[];
  files?: OrderFile[];
}

// Данные для создания заказа
export interface OrderCreateData {
  supplier_id: number;
  shipping_address?: string;
  notes?: string;
  expected_delivery_date?: string;
  items: OrderItemCreateData[];
}

// Данные для создания элемента заказа
export interface OrderItemCreateData {
  product_id: number;
  quantity: number;
  unit_price: number;
}

// Интерфейс для пагинации
export interface PaginationData {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// Интерфейс для результатов API запросов
export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Интерфейс для пагинированных результатов API запросов
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationData;
}

// Параметры фильтрации товаров
export interface ProductFilter {
  search?: string;
  category_id?: number;
  supplier_id?: number;
  low_stock?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Параметры фильтрации заказов
export interface OrderFilter {
  status?: OrderStatus;
  supplier_id?: number;
  start_date?: string;
  end_date?: string;
}

// Параметры для запроса подсказок адреса Dadata
export interface DadataAddressQuery {
  query: string;
  count?: number;
}

// Результат подсказок адреса Dadata
export interface DadataAddressSuggestion {
  value: string;
  unrestricted_value: string;
  data: Record<string, any>;
}

// Настройки пользовательского интерфейса
export interface UISettings {
  darkMode: boolean;
  language: string;
  notificationsEnabled: boolean;
} 