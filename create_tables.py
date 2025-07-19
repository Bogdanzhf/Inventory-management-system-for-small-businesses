#!/usr/bin/env python
"""
Скрипт для создания всех таблиц через SQLAlchemy напрямую
"""
import os
import sys
from dotenv import load_dotenv

# Добавляем текущий каталог в PYTHONPATH
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Загружаем переменные окружения
load_dotenv('.env.dev')

# Параметры подключения к PostgreSQL из переменных окружения
DB_USER = os.environ.get("POSTGRES_USER", "postgres")
DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "12345678")
DB_HOST = "localhost"  # Используем localhost для локальной разработки
DB_PORT = os.environ.get("POSTGRES_PORT", "5432")
DB_NAME = os.environ.get("POSTGRES_DB", "inventory_management_system")

def create_database():
    """Создаем базу данных если она не существует"""
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

    try:
        # Подключаемся к PostgreSQL серверу
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Проверяем существование базы данных
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (DB_NAME,))
        exists = cursor.fetchone()
        
        if not exists:
            # Создаем базу данных
            cursor.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"База данных {DB_NAME} создана успешно")
        else:
            print(f"База данных {DB_NAME} уже существует")
            
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Ошибка при создании базы данных: {e}")
        return False

def create_tables():
    """Создание таблиц в базе данных через Flask приложение"""
    try:
        # Импортируем Flask app и модели
        from backend.app.main import app
        from backend.app.models import User, UserRole
        from backend.app.core.extensions import db
        from werkzeug.security import generate_password_hash

        # Устанавливаем URI для подключения к БД
        app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        
        # Создаем контекст приложения
        with app.app_context():
            # Создаем все таблицы
            db.create_all()
            print("Таблицы созданы успешно")
            
            # Проверяем наличие администратора
            admin = db.session.query(User).filter_by(email="admin@example.com").first()
            
            if not admin:
                print("Создаем администратора...")
                admin = User()
                admin.email = "admin@example.com"
                admin.name = "Администратор"
                admin.role = UserRole.ADMIN.value
                admin.is_active = True
                admin.password_hash = generate_password_hash("admin123")
                
                db.session.add(admin)
                db.session.commit()
                print("Администратор создан успешно")
            
            return True
    except Exception as e:
        print(f"Ошибка при создании таблиц: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Инициализация базы данных...")
    if create_database():
        print("Создание таблиц...")
        create_tables() 