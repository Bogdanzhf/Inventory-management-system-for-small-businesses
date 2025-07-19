from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.extensions import db
from app.models.base import BaseModel


class OrderStatus(enum.Enum):
    """Статусы заказов"""
    PENDING = "pending"  # Ожидание
    PROCESSING = "processing"  # Обработка
    SHIPPED = "shipped"  # Отправлен
    DELIVERED = "delivered"  # Доставлен
    CANCELLED = "cancelled"  # Отменен


class OrderType(enum.Enum):
    """Типы заказов"""
    PURCHASE = "purchase"  # Закупка (от поставщика)
    SALE = "sale"  # Продажа (клиенту)
    TRANSFER = "transfer"  # Перемещение (между складами)
    RETURN = "return"  # Возврат


class Order(BaseModel):
    """Модель заказа"""
    __tablename__ = "orders"

    order_number = Column(String(50), nullable=False, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    status = Column(String, nullable=False, default=OrderStatus.PENDING.value)
    order_type = Column(String, nullable=False, default=OrderType.PURCHASE.value)
    total_amount = Column(Float, nullable=False, default=0.0)
    shipping_address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    expected_delivery_date = Column(DateTime, nullable=True)
    
    # Отношения
    user = relationship("User")
    supplier = relationship("Supplier", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", lazy="dynamic", cascade="all, delete-orphan")
    files = relationship("OrderFile", back_populates="order", lazy="dynamic", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order {self.order_number} ({self.status})>"
    
    def calculate_total(self):
        """Рассчитать общую сумму заказа"""
        total = sum(item.total_price for item in self.items)
        self.total_amount = total
        return total


class OrderItem(BaseModel):
    """Модель элемента заказа"""
    __tablename__ = "order_items"

    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    
    # Отношения
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    
    @property
    def total_price(self):
        """Рассчитать общую стоимость позиции"""
        return self.quantity * self.unit_price
    
    def __repr__(self):
        return f"<OrderItem order_id={self.order_id} product_id={self.product_id}>"


class OrderFile(BaseModel):
    """Модель файла, прикрепленного к заказу"""
    __tablename__ = "order_files"

    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(50), nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    # Отношения
    order = relationship("Order", back_populates="files")
    
    def __repr__(self):
        return f"<OrderFile order_id={self.order_id} filename={self.filename}>" 