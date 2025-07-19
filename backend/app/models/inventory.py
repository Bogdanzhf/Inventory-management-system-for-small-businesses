from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship, synonym
from sqlalchemy.sql import func

from app.models.base import BaseModel


class Category(BaseModel):
    """Модель категории товаров"""
    __tablename__ = "categories"

    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    # Отношения
    products = relationship("Product", back_populates="category", lazy="dynamic")

    def __repr__(self):
        return f"<Category {self.name}>"


class Supplier(BaseModel):
    """Модель поставщика товаров"""
    __tablename__ = "suppliers"

    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    contact_person = Column(String(255), nullable=True)

    # Отношения
    products = relationship("Product", back_populates="supplier", lazy="dynamic")
    orders = relationship("Order", back_populates="supplier", lazy="dynamic")

    def __repr__(self):
        return f"<Supplier {self.name}>"


class Product(BaseModel):
    """Модель товара"""
    __tablename__ = "products"

    name = Column(String(255), nullable=False)
    sku = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    quantity = Column(Integer, nullable=False, default=0)
    min_stock = Column(Integer, nullable=False, default=5)  # Минимальный запас
    min_threshold = synonym('min_stock')  # Синоним для обратной совместимости
    category_id = Column(Integer, ForeignKey("categories.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))

    # Отношения
    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    inventory_logs = relationship("InventoryLog", back_populates="product", lazy="dynamic")
    order_items = relationship("OrderItem", back_populates="product", lazy="dynamic")

    def __repr__(self):
        return f"<Product {self.name} ({self.sku})>"

    def is_low_stock(self):
        """Проверка низкого запаса товара"""
        return self.quantity <= self.min_stock


class InventoryLog(BaseModel):
    """Модель лога изменения запасов"""
    __tablename__ = "inventory_logs"

    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity_change = Column(Integer, nullable=False)  # Положительное - добавление, отрицательное - вычитание
    comment = Column(Text, nullable=True)

    # Отношения
    product = relationship("Product", back_populates="inventory_logs")
    user = relationship("User")

    def __repr__(self):
        return f"<InventoryLog product_id={self.product_id} change={self.quantity_change}>" 