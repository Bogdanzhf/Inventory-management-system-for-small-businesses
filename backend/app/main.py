import os
from flask import Flask, jsonify, redirect, url_for
from flask_cors import CORS
from dotenv import load_dotenv

from app.core.config import get_settings
from app.db.session import init_db
from app.api import init_routes
from app.schemas import register_schemas
from app.core.errors import register_error_handlers
from app.core.celery import init_celery, celery as celery_app
from app.core.extensions import init_extensions

# Загрузка переменных окружения
load_dotenv()

def create_app():
    # Инициализация приложения Flask
    app = Flask(__name__)
    settings = get_settings()
    
    # Настройка приложения
    app.config.from_object(settings)
    
    # Явно устанавливаем SQLALCHEMY_DATABASE_URI из переменной окружения
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:12345678@localhost:5432/inventory_management_system"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Настройка Celery
    app.config['CELERY_BROKER_URL'] = os.environ.get(
        "CELERY_BROKER_URL", 
        "redis://localhost:6379/0"
    )
    app.config['CELERY_RESULT_BACKEND'] = os.environ.get(
        "CELERY_RESULT_BACKEND", 
        "redis://localhost:6379/0"
    )
    
    # Настройка CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Инициализация расширений
    init_extensions(app)
    
    # Инициализация Celery
    init_celery(app)
    
    # Регистрация схем после инициализации Marshmallow
    # Получаем словарь схем и добавляем его в глобальный объект g
    app.config['SCHEMAS'] = register_schemas()
    
    # Регистрация обработчиков ошибок
    register_error_handlers(app)
    
    # Регистрация маршрутов
    init_routes(app)
    
    # Добавляем корневой маршрут
    @app.route('/')
    def index():
        return jsonify({
            "message": "Inventory Management System API",
            "version": "1.0.0",
            "status": "running",
            "documentation": "/api/docs"
        })
    
    return app

app = create_app()
# Обновляем глобальный экземпляр celery для использования в задачах
celery = celery_app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True) 