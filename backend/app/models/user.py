from sqlalchemy import Column, String, Boolean, Enum
from werkzeug.security import generate_password_hash, check_password_hash
import enum

from app.models.base import BaseModel


class UserRole(enum.Enum):
    """Роли пользователей в системе"""
    ADMIN = "admin"  # Администратор
    OWNER = "owner"  # Владелец бизнеса
    EMPLOYEE = "employee"  # Сотрудник


class User(BaseModel):
    """Модель пользователя системы"""
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String, nullable=False, default=UserRole.EMPLOYEE.value)
    is_active = Column(Boolean, default=True)
    phone = Column(String(20), nullable=True)
    
    @property
    def password(self):
        """Запрет на чтение пароля"""
        raise AttributeError("Password is not a readable attribute")
    
    @password.setter
    def password(self, password):
        """Хеширование пароля"""
        self.password_hash = generate_password_hash(password)
    
    def set_password(self, password):
        """Хеширование пароля"""
        self.password_hash = generate_password_hash(password)
    
    def verify_password(self, password):
        """Проверка пароля"""
        return check_password_hash(self.password_hash, password)
    
    def is_admin(self):
        """Проверка, является ли пользователь администратором"""
        return self.role == UserRole.ADMIN.value
    
    def is_owner(self):
        """Проверка, является ли пользователь владельцем"""
        return self.role == UserRole.OWNER.value
    
    def __repr__(self):
        return f"<User {self.email}>" 