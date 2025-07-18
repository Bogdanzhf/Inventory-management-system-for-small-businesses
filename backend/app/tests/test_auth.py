import json
import pytest
from flask import url_for


def test_register_success(client, db):
    """Тест успешной регистрации пользователя."""
    data = {
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User",
        "role": "employee"
    }
    
    response = client.post(
        "/api/auth/register",
        data=json.dumps(data),
        content_type="application/json"
    )
    
    # Проверяем статус ответа
    assert response.status_code == 201
    
    # Проверяем содержимое ответа
    response_data = json.loads(response.data)
    assert "access_token" in response_data
    assert "refresh_token" in response_data
    assert "user" in response_data
    assert response_data["user"]["email"] == "test@example.com"
    assert response_data["user"]["name"] == "Test User"
    assert response_data["user"]["role"] == "employee"


def test_register_duplicate_email(client, admin_user):
    """Тест регистрации с уже существующим email."""
    data = {
        "email": admin_user.email,  # Используем email существующего пользователя
        "password": "password123",
        "name": "Another User",
        "role": "employee"
    }
    
    response = client.post(
        "/api/auth/register",
        data=json.dumps(data),
        content_type="application/json"
    )
    
    # Проверяем статус ответа
    assert response.status_code == 400
    
    # Проверяем сообщение об ошибке
    response_data = json.loads(response.data)
    assert "errors" in response_data
    assert "email" in response_data["errors"]


def test_register_invalid_data(client):
    """Тест регистрации с некорректными данными."""
    # Отсутствует обязательное поле email
    data = {
        "password": "password123",
        "name": "Test User"
    }
    
    response = client.post(
        "/api/auth/register",
        data=json.dumps(data),
        content_type="application/json"
    )
    
    # Проверяем статус ответа
    assert response.status_code == 400
    
    # Проверяем сообщение об ошибке
    response_data = json.loads(response.data)
    assert "errors" in response_data
    assert "email" in response_data["errors"]


def test_login_success(client, employee_user):
    """Тест успешной авторизации."""
    data = {
        "email": employee_user.email,
        "password": "password123"
    }
    
    response = client.post(
        "/api/auth/login",
        data=json.dumps(data),
        content_type="application/json"
    )
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем содержимое ответа
    response_data = json.loads(response.data)
    assert "access_token" in response_data
    assert "refresh_token" in response_data
    assert "user" in response_data
    assert response_data["user"]["email"] == employee_user.email
    assert response_data["user"]["name"] == employee_user.name
    assert response_data["user"]["role"] == employee_user.role.value


def test_login_invalid_credentials(client, employee_user):
    """Тест авторизации с неверными учетными данными."""
    data = {
        "email": employee_user.email,
        "password": "wrong_password"
    }
    
    response = client.post(
        "/api/auth/login",
        data=json.dumps(data),
        content_type="application/json"
    )
    
    # Проверяем статус ответа
    assert response.status_code == 401
    
    # Проверяем сообщение об ошибке
    response_data = json.loads(response.data)
    assert "message" in response_data
    assert "Неверный email или пароль" == response_data["message"]


def test_refresh_token(client, employee_token, employee_user):
    """Тест обновления токена доступа."""
    response = client.post(
        "/api/auth/refresh",
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем содержимое ответа
    response_data = json.loads(response.data)
    assert "access_token" in response_data
    assert "message" in response_data 