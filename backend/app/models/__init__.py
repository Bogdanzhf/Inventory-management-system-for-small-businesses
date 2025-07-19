from .base import BaseModel
from .user import User, UserRole
from .inventory import Category, Supplier, Product, InventoryLog
from .order import Order, OrderItem, OrderFile, OrderStatus, OrderType

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