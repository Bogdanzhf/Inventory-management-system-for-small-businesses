import pytest
from flask_jwt_extended import create_access_token
import os
import tempfile
import sys

# Добавляем путь проекта в PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from backend.app.main import create_app
from backend.app.core.extensions import db as _db
from backend.app.models import User, UserRole, Category, Supplier, Product


@pytest.fixture(scope="session")
def app():
    """Создание экземпляра приложения Flask для тестирования."""
    # Устанавливаем переменные окружения для тестирования
    os.environ["ENVIRONMENT"] = "test"
    os.environ["FLASK_DEBUG"] = "1"
    
    # Создаем экземпляр приложения
    app = create_app()
    
    # Настройка тестовой базы данных
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture(scope="function")
def db(app):
    """Создание новой базы данных для каждого теста."""
    with app.app_context():
        _db.create_all()
        
        yield _db
        
        _db.session.rollback()
        _db.session.close()
        _db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    """Создание тестового клиента."""
    return app.test_client()


@pytest.fixture(scope="function")
def admin_user(db):
    """Создание администратора для тестов."""
    user = User()
    user.email = "admin@example.com"
    user.name = "Admin User"
    user.role = UserRole.ADMIN.value
    user.is_active = True
    user.set_password("password123")
    
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture(scope="function")
def employee_user(db):
    """Создание обычного сотрудника для тестов."""
    user = User()
    user.email = "employee@example.com"
    user.name = "Employee User"
    user.role = UserRole.EMPLOYEE.value
    user.is_active = True
    user.set_password("password123")
    
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture(scope="function")
def owner_user(db):
    """Создание владельца для тестов."""
    user = User()
    user.email = "owner@example.com"
    user.name = "Owner User"
    user.role = UserRole.OWNER.value
    user.is_active = True
    user.set_password("password123")
    
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture(scope="function")
def admin_token(admin_user):
    """Создание токена доступа для администратора."""
    access_token = create_access_token(identity=admin_user.id)
    return access_token


@pytest.fixture(scope="function")
def employee_token(employee_user):
    """Создание токена доступа для сотрудника."""
    access_token = create_access_token(identity=employee_user.id)
    return access_token


@pytest.fixture(scope="function")
def owner_token(owner_user):
    """Создание токена доступа для владельца."""
    access_token = create_access_token(identity=owner_user.id)
    return access_token


@pytest.fixture(scope="function")
def auth_header(admin_token):
    """Создание заголовка авторизации с токеном администратора."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="function")
def employee_auth_header(employee_token):
    """Создание заголовка авторизации с токеном сотрудника."""
    return {"Authorization": f"Bearer {employee_token}"}


@pytest.fixture(scope="function")
def owner_auth_header(owner_token):
    """Создание заголовка авторизации с токеном владельца."""
    return {"Authorization": f"Bearer {owner_token}"}


@pytest.fixture(scope="function")
def category(db):
    """Создание тестовой категории."""
    category = Category()
    category.name = "Test Category"
    category.description = "Test Description"
    
    db.session.add(category)
    db.session.commit()
    return category


@pytest.fixture(scope="function")
def supplier(db):
    """Создание тестового поставщика."""
    supplier = Supplier()
    supplier.name = "Test Supplier"
    supplier.email = "supplier@example.com"
    supplier.phone = "1234567890"
    supplier.address = "Test Address"
    supplier.contact_person = "Test Contact"
    
    db.session.add(supplier)
    db.session.commit()
    return supplier


@pytest.fixture(scope="function")
def product(db, category, supplier):
    """Создание тестового товара."""
    product = Product()
    product.name = "Test Product"
    product.sku = "TEST-SKU-001"
    product.description = "Test Product Description"
    product.price = 100.0
    product.quantity = 50
    product.min_stock = 10
    product.category_id = category.id
    product.supplier_id = supplier.id
    
    db.session.add(product)
    db.session.commit()
    return product 