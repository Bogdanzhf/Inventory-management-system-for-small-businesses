#!/usr/bin/env python
"""
Скрипт для запуска проекта
"""
import os
import sys
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

# Проверяем наличие необходимых директорий и файлов
if not os.path.exists('ssl'):
    print("Директория ssl не найдена. Создаем сертификаты...")
    try:
        # Запускаем скрипт для генерации сертификатов
        os.system("python generate_certs.py")
    except Exception as e:
        print(f"Ошибка при создании сертификатов: {e}")
        sys.exit(1)

# Запускаем Flask приложение
print("Запуск Flask приложения...")
os.system("cd backend && python -m app.main") 