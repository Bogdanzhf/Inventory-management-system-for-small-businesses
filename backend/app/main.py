import os
import logging
from flask import Flask, jsonify, redirect, url_for, request
from flask_cors import CORS
from dotenv import load_dotenv

# Используем относительные импорты
from .core.config import get_settings
from .db.session import init_db, check_db_connection
from .api import init_routes
from .schemas import register_schemas
from .core.errors import register_error_handlers
from .core.celery import init_celery, celery as celery_app
from .core.extensions import init_extensions

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

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
    
    # Настройка JWT
    app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY", "your-secret-key-here-for-jwt-tokens")
    app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", "your-flask-secret-key-here")
    
    # Настройка Celery
    app.config['CELERY_BROKER_URL'] = os.environ.get(
        "CELERY_BROKER_URL", 
        "redis://localhost:6379/0"
    )
    app.config['CELERY_RESULT_BACKEND'] = os.environ.get(
        "CELERY_RESULT_BACKEND", 
        "redis://localhost:6379/0"
    )
    
    # Логирование конфигурации
    logger.info(f"SQLALCHEMY_DATABASE_URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    logger.info(f"ENVIRONMENT: {os.environ.get('ENVIRONMENT', 'development')}")
    
    # Настройка CORS - более подробная конфигурация
    CORS(app, 
         resources={r"/*": {"origins": "*"}}, 
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         expose_headers=["Content-Length", "Content-Range", "Content-Type"]
    )
    
    # Добавляем middleware для логирования запросов
    @app.before_request
    def log_request_info():
        logger.debug('Headers: %s', request.headers)
        logger.debug('Body: %s', request.get_data())
        logger.debug('Method: %s, Path: %s', request.method, request.path)
    
    # Инициализация расширений
    init_extensions(app)
    
    # Инициализация Celery
    init_celery(app)
    
    # Регистрация схем после инициализации Marshmallow
    # Получаем словарь схем и добавляем его в глобальный объект g
    app.config['SCHEMAS'] = register_schemas()
    
    # Проверка подключения к БД
    with app.app_context():
        db_connected = check_db_connection()
        if not db_connected:
            logger.error("Не удалось подключиться к базе данных. Приложение может работать некорректно.")
    
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