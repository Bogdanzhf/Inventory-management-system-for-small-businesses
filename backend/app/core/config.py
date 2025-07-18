import os
from typing import Dict, Any


class BaseSettings:
    """Базовые настройки приложения"""
    # Приложение
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "default-secret-key")
    DEBUG: bool = False
    
    # База данных
    SQLALCHEMY_DATABASE_URI: str = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:12345678@localhost:5432/inventory_management_system"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    
    # JWT
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "default-jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES: int = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 3600))  # 1 час
    JWT_REFRESH_TOKEN_EXPIRES: int = int(os.environ.get("JWT_REFRESH_TOKEN_EXPIRES", 604800))  # 7 дней
    JWT_COOKIE_SECURE: bool = True  # Только для HTTPS
    JWT_COOKIE_CSRF_PROTECT: bool = True  # Защита от CSRF
    JWT_TOKEN_LOCATION: list = ["headers"]  # Где искать токены
    
    # SendGrid
    SENDGRID_API_KEY: str = os.environ.get("SENDGRID_API_KEY", "")
    EMAIL_FROM: str = os.environ.get("EMAIL_FROM", "")
    
    # Dadata
    DADATA_API_KEY: str = os.environ.get("DADATA_API_KEY", "")
    DADATA_SECRET_KEY: str = os.environ.get("DADATA_SECRET_KEY", "")


class DevelopmentSettings(BaseSettings):
    """Настройки для разработки"""
    DEBUG: bool = True
    JWT_COOKIE_SECURE: bool = False  # В разработке можно использовать HTTP


class ProductionSettings(BaseSettings):
    """Настройки для продакшн"""
    DEBUG: bool = False


class TestSettings(BaseSettings):
    """Настройки для тестирования"""
    DEBUG: bool = True
    TESTING: bool = True
    SQLALCHEMY_DATABASE_URI: str = "postgresql://postgres:12345678@localhost:5432/inventory_test"
    JWT_SECRET_KEY: str = "test-jwt-secret-key"
    JWT_COOKIE_SECURE: bool = False  # В тестах можно использовать HTTP


def get_settings() -> Dict[str, Any]:
    """Получение настроек в зависимости от окружения"""
    env = os.environ.get("ENVIRONMENT", "development")
    
    settings_map = {
        "development": DevelopmentSettings,
        "production": ProductionSettings,
        "test": TestSettings
    }
    
    settings_class = settings_map.get(env, DevelopmentSettings)
    return settings_class().__dict__ 