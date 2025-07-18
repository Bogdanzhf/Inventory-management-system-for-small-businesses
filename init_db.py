#!/usr/bin/env python
"""
Скрипт для инициализации базы данных PostgreSQL
"""
import os
import sys
import subprocess
import time
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

# Параметры подключения к PostgreSQL из переменных окружения
DB_USER = os.environ.get("POSTGRES_USER", "postgres")
DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "12345678")
DB_HOST = os.environ.get("POSTGRES_HOST", "localhost")
DB_PORT = os.environ.get("POSTGRES_PORT", "5432")
DB_NAME = os.environ.get("POSTGRES_DB", "inventory_management_system")

def wait_for_postgres(max_retries=5, retry_interval=5):
    """Ожидание доступности PostgreSQL сервера"""
    retries = 0
    while retries < max_retries:
        try:
            conn = psycopg2.connect(
                user=DB_USER,
                password=DB_PASSWORD,
                host=DB_HOST,
                port=DB_PORT
            )
            conn.close()
            print("PostgreSQL доступен")
            return True
        except psycopg2.OperationalError as e:
            print(f"Ожидание PostgreSQL: {e}")
            retries += 1
            if retries >= max_retries:
                print("Достигнуто максимальное количество попыток")
                return False
            time.sleep(retry_interval)
    return False

def create_database():
    """Создание базы данных, если она не существует"""
    try:
        # Ожидание доступности PostgreSQL
        if not wait_for_postgres():
            print("Невозможно подключиться к PostgreSQL серверу")
            return False
            
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
    except psycopg2.Error as e:
        print(f"Ошибка PostgreSQL при создании базы данных: {e}")
        return False
    except Exception as e:
        print(f"Непредвиденная ошибка при создании базы данных: {e}")
        return False

def run_command(command):
    """Запуск команды с выводом результата"""
    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True,
            text=True
        )
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print(f"Ошибка: {stderr}")
            return False
        
        print(stdout)
        return True
    except Exception as e:
        print(f"Ошибка при выполнении команды: {e}")
        return False

def init_alembic():
    """Инициализация Alembic для миграций"""
    try:
        # Проверяем, инициализирован ли уже Alembic
        if not os.path.exists("database/migrations/versions"):
            os.makedirs("database/migrations/versions", exist_ok=True)
            
        # Экспортируем переменные окружения для Alembic
        os.environ["DATABASE_URL"] = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
            
        # Запуск команды для создания первой миграции
        if not run_command("cd database && alembic revision --autogenerate -m \"Initial_migration\""):
            return False
            
        # Применение миграций
        if not run_command("cd database && alembic upgrade head"):
            return False
            
        print("Миграции успешно применены")
        return True
    except Exception as e:
        print(f"Ошибка при инициализации миграций: {e}")
        return False

if __name__ == "__main__":
    print("Инициализация базы данных...")
    if create_database():
        print("Инициализация миграций...")
        if not init_alembic():
            print("Ошибка при инициализации миграций")
            sys.exit(1)
    else:
        print("Ошибка при создании базы данных")
        sys.exit(1)
        
    print("Инициализация базы данных завершена успешно") 