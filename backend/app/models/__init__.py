from app.models.base import BaseModel
from app.models.user import User, UserRole
from app.models.inventory import Category, Supplier, Product, InventoryLog
from app.models.order import Order, OrderItem, OrderFile, OrderStatus, OrderType

# Для удобства импорта
__all__ = [
    "BaseModel",
    "User", 
    "UserRole",
    "Category", 
    "Supplier", 
    "Product", 
    "InventoryLog",
    "Order", 
    "OrderItem", 
    "OrderFile", 
    "OrderStatus",
    "OrderType",
] 