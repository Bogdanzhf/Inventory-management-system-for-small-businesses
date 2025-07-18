"""
Тесты для API инвентаря
"""
import pytest
from flask import Flask
from flask_jwt_extended import create_access_token

from ..core.config import TestSettings
from ..models.user import User
from ..models.inventory import Product, Category
from ..db.session import db, init_db
from ..core.security import get_password_hash

@pytest.fixture
def app():
    """Создание тестового приложения Flask"""
    app = Flask(__name__)
    app.config.from_object(TestSettings())
    
    # Инициализация базы данных
    init_db(app)
    
    # Создание тестовых данных
    with app.app_context():
        # Создание тестового пользователя
        user = User(
            email="test@example.com",
            password_hash=get_password_hash("password"),
            first_name="Test",
            last_name="User",
            role="admin"
        )
        db.session.add(user)
        
        # Создание тестовой категории
        category = Category(name="Test Category")
        db.session.add(category)
        
        db.session.commit()
    
    yield app
    
    # Очистка после тестов
    with app.app_context():
        db.drop_all()

@pytest.fixture
def client(app):
    """Создание тестового клиента"""
    return app.test_client()

@pytest.fixture
def auth_headers(app):
    """Создание заголовков авторизации"""
    with app.app_context():
        user = User.query.filter_by(email="test@example.com").first()
        token = create_access_token(identity=user.id)
        return {"Authorization": f"Bearer {token}"}

def test_create_inventory_item(app, client, auth_headers):
    """Тест создания товара"""
    # Данные для создания товара
    data = {
        "name": "Test Product",
        "sku": "TEST-123",
        "description": "Test description",
        "price": 10.99,
        "quantity": 100,
        "category_id": 1
    }
    
    # Отправка запроса
    response = client.post("/api/inventory", json=data, headers=auth_headers)
    
    # Проверка ответа
    assert response.status_code == 201
    assert response.json["name"] == "Test Product"
    assert response.json["sku"] == "TEST-123"
    assert response.json["quantity"] == 100
    
    # Проверка в базе данных
    with app.app_context():
        item = db.query(Product).filter_by(sku="TEST-123").first()
        assert item is not None
        assert item.name == "Test Product"
        assert item.price == 10.99

def test_get_inventory_items(app, client, auth_headers):
    """Тест получения списка товаров"""
    # Создание тестового товара
    with app.app_context():
        category = Category.query.first()
        
        item = Product(
            name="Test Product",
            sku="TEST-123",
            description="Test description",
            price=10.99,
            quantity=100,
            category_id=category.id
        )
        db.session.add(item)
        db.session.commit()
    
    # Отправка запроса
    response = client.get("/api/inventory", headers=auth_headers)
    
    # Проверка ответа
    assert response.status_code == 200
    assert len(response.json) >= 1
    assert any(item["sku"] == "TEST-123" for item in response.json)

def test_update_inventory_item(app, client, auth_headers):
    """Тест обновления товара"""
    # Создание тестового товара
    with app.app_context():
        category = Category.query.first()
        
        item = Product(
            name="Test Product",
            sku="TEST-123",
            description="Test description",
            price=10.99,
            quantity=100,
            category_id=category.id
        )
        db.session.add(item)
        db.session.commit()
        item_id = item.id
    
    # Данные для обновления
    update_data = {
        "name": "Updated Product",
        "price": 15.99,
        "quantity": 150
    }
    
    # Отправка запроса
    response = client.put(f"/api/inventory/{item_id}", json=update_data, headers=auth_headers)
    
    # Проверка ответа
    assert response.status_code == 200
    assert response.json["name"] == "Updated Product"
    assert response.json["price"] == 15.99
    assert response.json["quantity"] == 150
    
    # Проверка в базе данных
    with app.app_context():
        updated_item = db.query(Product).filter_by(id=item_id).first()
        assert updated_item.name == "Updated Product"
        assert updated_item.price == 15.99
        assert updated_item.quantity == 150

def test_delete_inventory_item(app, client, auth_headers):
    """Тест удаления товара"""
    # Создание тестового товара
    with app.app_context():
        category = Category.query.first()
        
        item = Product(
            name="Test Product",
            sku="TEST-123",
            description="Test description",
            price=10.99,
            quantity=100,
            category_id=category.id
        )
        db.session.add(item)
        db.session.commit()
        item_id = item.id
    
    # Отправка запроса
    response = client.delete(f"/api/inventory/{item_id}", headers=auth_headers)
    
    # Проверка ответа
    assert response.status_code == 200
    
    # Проверка в базе данных
    with app.app_context():
        deleted_item = db.query(Product).filter_by(id=item_id).first()
        assert deleted_item is None 