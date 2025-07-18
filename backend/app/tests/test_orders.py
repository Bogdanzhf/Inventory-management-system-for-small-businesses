"""
Тесты для API заказов
"""
import pytest
from flask import Flask
from flask_jwt_extended import create_access_token
from datetime import datetime

from ..core.config import TestSettings
from ..models.user import User
from ..models.inventory import Product, Category
from ..models.order import Order, OrderItem
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
        
        # Создание тестового товара
        product = Product(
            name="Test Product",
            sku="TEST-123",
            description="Test description",
            price=10.99,
            quantity=100,
            category_id=1
        )
        db.session.add(product)
        
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

def test_create_order(app, client, auth_headers):
    """Тест создания заказа"""
    # Данные для создания заказа
    data = {
        "order_type": "outgoing",
        "status": "pending",
        "items": [
            {
                "product_id": 1,
                "quantity": 5,
                "unit_price": 10.99
            }
        ]
    }
    
    # Отправка запроса
    response = client.post("/api/orders", json=data, headers=auth_headers)
    
    # Проверка ответа
    assert response.status_code == 201
    assert response.json["order_type"] == "outgoing"
    assert response.json["status"] == "pending"
    assert len(response.json["items"]) == 1
    
    # Проверка в базе данных
    with app.app_context():
        order = Order.query.first()
        assert order is not None
        assert order.order_type == "outgoing"
        assert order.status == "pending"
        assert len(order.items) == 1
        
        # Проверка обновления количества товара
        inventory_item = db.query(Product).filter_by(id=1).first()
        assert inventory_item.quantity == 95  # 100 - 5

def test_get_orders(app, client, auth_headers):
    """Тест получения списка заказов"""
    # Создание тестового заказа
    with app.app_context():
        user = User.query.first()
        product = Product.query.first()
        
        order = Order(
            order_type="outgoing",
            status="pending",
            user_id=user.id
        )
        db.session.add(order)
        db.session.commit()
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=5,
            unit_price=product.price
        )
        db.session.add(order_item)
        db.session.commit()
    
    # Отправка запроса
    response = client.get("/api/orders", headers=auth_headers)
    
    # Проверка ответа
    assert response.status_code == 200
    assert len(response.json) >= 1
    assert response.json[0]["order_type"] == "outgoing"
    assert response.json[0]["status"] == "pending"

def test_update_order_status(app, client, auth_headers):
    """Тест обновления статуса заказа"""
    # Создание тестового заказа
    with app.app_context():
        user = User.query.first()
        product = Product.query.first()
        
        order = Order(
            order_type="outgoing",
            status="pending",
            user_id=user.id
        )
        db.session.add(order)
        db.session.commit()
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=5,
            unit_price=product.price
        )
        db.session.add(order_item)
        db.session.commit()
        order_id = order.id
    
    # Данные для обновления
    update_data = {
        "status": "completed"
    }
    
    # Отправка запроса
    response = client.put(f"/api/orders/{order_id}", json=update_data, headers=auth_headers)
    
    # Проверка ответа
    assert response.status_code == 200
    assert response.json["status"] == "completed"
    
    # Проверка в базе данных
    with app.app_context():
        updated_order = Order.query.filter_by(id=order_id).first()
        assert updated_order.status == "completed" 