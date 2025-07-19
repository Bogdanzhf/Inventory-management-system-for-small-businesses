#!/usr/bin/env python
"""
Скрипт для инициализации базы данных с минимальным набором зависимостей
"""
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv('.env.dev')

# Параметры подключения к PostgreSQL из переменных окружения
DB_USER = os.environ.get("POSTGRES_USER", "postgres")
DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "12345678")
DB_HOST = "localhost"  # Принудительно используем localhost для локальной разработки
DB_PORT = os.environ.get("POSTGRES_PORT", "5432")
DB_NAME = os.environ.get("POSTGRES_DB", "inventory_management_system")

def create_database():
    """Создание базы данных, если она не существует"""
    try:
        # Подключение к PostgreSQL серверу
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Проверка существования базы данных
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (DB_NAME,))
        exists = cursor.fetchone()
        
        if not exists:
            # Создание базы данных
            cursor.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"База данных {DB_NAME} успешно создана")
        else:
            print(f"База данных {DB_NAME} уже существует")
        
        cursor.close()
        conn.close()
        
        return True
    except Exception as e:
        print(f"Ошибка при создании базы данных: {e}")
        return False

def create_tables():
    """Создание таблиц в базе данных через прямые SQL-запросы"""
    try:
        # Подключение к созданной базе данных
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME
        )
        cursor = conn.cursor()
        
        # SQL для создания таблицы users
        create_users_table = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'employee',
            is_active BOOLEAN DEFAULT TRUE,
            phone VARCHAR(20)
        );
        """
        
        # SQL для создания таблицы categories
        create_categories_table = """
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT
        );
        """
        
        # SQL для создания таблицы suppliers
        create_suppliers_table = """
        CREATE TABLE IF NOT EXISTS suppliers (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(20),
            address TEXT,
            contact_person VARCHAR(255)
        );
        """
        
        # SQL для создания таблицы products
        create_products_table = """
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            name VARCHAR(255) NOT NULL,
            sku VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            price FLOAT NOT NULL DEFAULT 0.0,
            quantity INTEGER NOT NULL DEFAULT 0,
            min_stock INTEGER NOT NULL DEFAULT 5,
            category_id INTEGER REFERENCES categories(id),
            supplier_id INTEGER REFERENCES suppliers(id)
        );
        """
        
        # SQL для создания таблицы orders
        create_orders_table = """
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            order_number VARCHAR(50) UNIQUE NOT NULL,
            user_id INTEGER REFERENCES users(id) NOT NULL,
            supplier_id INTEGER REFERENCES suppliers(id) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            order_type VARCHAR(50) NOT NULL DEFAULT 'purchase',
            total_amount FLOAT NOT NULL DEFAULT 0.0,
            shipping_address TEXT,
            notes TEXT,
            expected_delivery_date TIMESTAMP
        );
        """
        
        # SQL для создания таблицы order_items
        create_order_items_table = """
        CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            order_id INTEGER REFERENCES orders(id) NOT NULL,
            product_id INTEGER REFERENCES products(id) NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price FLOAT NOT NULL
        );
        """
        
        # SQL для создания таблицы order_files
        create_order_files_table = """
        CREATE TABLE IF NOT EXISTS order_files (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            order_id INTEGER REFERENCES orders(id) NOT NULL,
            filename VARCHAR(255) NOT NULL,
            file_path VARCHAR(512) NOT NULL,
            file_type VARCHAR(50),
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        # SQL для создания таблицы inventory_logs
        create_inventory_logs_table = """
        CREATE TABLE IF NOT EXISTS inventory_logs (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            product_id INTEGER REFERENCES products(id) NOT NULL,
            user_id INTEGER REFERENCES users(id) NOT NULL,
            quantity_change INTEGER NOT NULL,
            comment TEXT
        );
        """
        
        # Выполнение SQL запросов
        cursor.execute(create_users_table)
        cursor.execute(create_categories_table)
        cursor.execute(create_suppliers_table)
        cursor.execute(create_products_table)
        cursor.execute(create_orders_table)
        cursor.execute(create_order_items_table)
        cursor.execute(create_order_files_table)
        cursor.execute(create_inventory_logs_table)
        
        # Создаем индексы для ускорения поиска
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);")
        
        # Проверяем наличие администратора
        cursor.execute("SELECT id FROM users WHERE email = 'admin@example.com';")
        admin_exists = cursor.fetchone()
        
        if not admin_exists:
            # Создаем администратора
            password_hash = generate_password_hash("admin123")
            cursor.execute(
                """
                INSERT INTO users (email, password_hash, name, role, is_active)
                VALUES (%s, %s, %s, %s, %s);
                """,
                ("admin@example.com", password_hash, "Администратор", "admin", True)
            )
            print("Администратор успешно создан")
        else:
            print("Администратор уже существует")
        
        # Фиксируем изменения
        conn.commit()
        
        print("Все таблицы успешно созданы")
        
        cursor.close()
        conn.close()
        
        return True
    except Exception as e:
        print(f"Ошибка при создании таблиц: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Инициализация базы данных PostgreSQL...")
    if create_database():
        create_tables() 