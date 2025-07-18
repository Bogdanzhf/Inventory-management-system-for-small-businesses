"""
Тесты для API аналитики
"""
import pytest
from flask import Flask
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta

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
        
        # Создание тестовых товаров
        for i in range(3):
            product = Product(
                name=f"Test Product {i+1}",
                sku=f"TEST-{i+1}",
                description=f"Test description {i+1}",
                price=10.99 + i,
                quantity=100 - i*10,
                category_id=1,
                min_stock=10
            )
            db.session.add(product)
        
        db.session.commit()
        
        # Создание тестовых заказов
        for i in range(5):
            order = Order(
                order_type="outgoing" if i % 2 == 0 else "incoming",
                status="completed",
                user_id=1,
                created_at=datetime.now() - timedelta(days=i*3)
            )
            db.session.add(order)
            db.session.commit()
            
            # Добавление товаров в заказ
            for j in range(1, 3):
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=j,
                    quantity=5,
                    unit_price=10.99 + j
                )
                db.session.add(order_item)
        
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

def test_get_sales_trends(app, client, auth_headers):
    """Тест получения трендов продаж"""
    # Отправка запроса
    response = client.get("/api/analytics/sales-trends", headers=auth_headers)
    
    # Проверка ответа
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) > 0
    assert "date" in response.json[0]
    assert "total_sales" in response.json[0]
    assert "order_count" in response.json[0]

def test_get_category_distribution(app, client, auth_headers):
    """Тест получения распределения по категориям"""
    # Отправка запроса
    response = client.get("/api/analytics/category-distribution", headers=auth_headers)
    
    # Проверка ответа
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) > 0
    assert "category" in response.json[0]
    assert "value" in response.json[0]
    assert "percentage" in response.json[0]

def test_get_top_products(app, client, auth_headers):
    """Тест получения топ продуктов"""
    # Отправка запроса
    response = client.get("/api/analytics/top-products", headers=auth_headers)
    
    # Проверка ответа
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) > 0
    assert "product_id" in response.json[0]
    assert "product_name" in response.json[0]
    assert "quantity_sold" in response.json[0]
    assert "revenue" in response.json[0]

def test_get_dashboard_stats(app, client, auth_headers):
    """Тест получения статистики для дашборда"""
    # Отправка запроса
    response = client.get("/api/analytics/dashboard-stats", headers=auth_headers)
    
    # Проверка ответа
    assert response.status_code == 200
    assert "sales_today" in response.json
    assert "sales_yesterday" in response.json
    assert "sales_this_month" in response.json
    assert "sales_prev_month" in response.json
    assert "inventory_stats" in response.json
    assert "total_inventory" in response.json["inventory_stats"]
    assert "low_stock_items" in response.json["inventory_stats"] 