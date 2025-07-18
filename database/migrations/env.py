from logging.config import fileConfig
import configparser
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "../../"))
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Импортируем модели
# Используем относительные пути с учетом структуры проекта
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from backend.app.db.base import Base
from backend.app.models.user import User
from backend.app.models.inventory import Category, Supplier, Product, InventoryLog
from backend.app.models.order import Order, OrderItem, OrderFile

# Это объект конфигурации Alembic, который предоставляет
# доступ к значениям в используемом файле .ini.
config = context.config

# Обновляем URL подключения из переменных окружения
url = config.get_main_option("sqlalchemy.url")
if url is not None:
    url = url % {
        'POSTGRES_USER': os.getenv('POSTGRES_USER', 'postgres'),
        'POSTGRES_PASSWORD': os.getenv('POSTGRES_PASSWORD', '12345678'),
        'POSTGRES_HOST': os.getenv('POSTGRES_HOST', 'localhost'),
        'POSTGRES_PORT': os.getenv('POSTGRES_PORT', '5432'),
        'POSTGRES_DB': os.getenv('POSTGRES_DB', 'inventory_management_system')
    }
    config.set_main_option("sqlalchemy.url", url)

# Интерпретация файла конфигурации для логирования Python.
# Эта строка настраивает логгеры.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Добавьте объект MetaData вашей модели здесь
# для поддержки 'autogenerate'
target_metadata = Base.metadata

# другие значения из конфигурации, определенные потребностями env.py,
# могут быть получены:
# my_important_option = config.get_main_option("my_important_option")
# ... и т.д.


def run_migrations_offline():
    """Запуск миграций в 'офлайн' режиме.

    Это настраивает контекст только с URL
    без Engine, хотя Engine также приемлем
    здесь. Пропуская создание Engine,
    нам даже не нужен доступный DBAPI.

    Вызовы context.execute() здесь выдают заданную строку в
    вывод скрипта.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Запуск миграций в 'онлайн' режиме.

    В этом сценарии нам нужно создать Engine
    и связать соединение с контекстом.
    """
    # Создаем движок из конфигурации
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    # Используем прямую конфигурацию соединения вместо контекстного менеджера
    connection = connectable.connect()
    try:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()
    finally:
        connection.close()  # Обеспечиваем закрытие соединения


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online() 