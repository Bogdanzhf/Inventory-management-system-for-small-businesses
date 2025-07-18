"""
Файл для импорта всех моделей для Alembic
"""
# Импорт сессии базы данных, которая содержит объект SQLAlchemy
from .session import db

# Теперь используем db.Model вместо Base
Base = db.Model

# Импорт всех моделей для обнаружения их Alembic
from ..models.user import User
from ..models.inventory import Product, Category, Supplier
from ..models.order import Order, OrderItem 