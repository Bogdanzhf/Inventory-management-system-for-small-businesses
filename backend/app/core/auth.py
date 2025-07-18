from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, create_access_token, create_refresh_token

from app.models.user import User, UserRole


def token_required(f):
    """Декоратор для проверки JWT токена"""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"message": "Пользователь не найден"}), 401
            
        if not user.is_active:
            return jsonify({"message": "Аккаунт деактивирован"}), 403
            
        return f(user, *args, **kwargs)
    return decorated


def admin_required(f):
    """Декоратор для проверки, что пользователь является администратором"""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"message": "Пользователь не найден"}), 401
            
        if not user.is_active:
            return jsonify({"message": "Аккаунт деактивирован"}), 403
            
        if user.role != UserRole.ADMIN:
            return jsonify({"message": "Доступ запрещен. Требуются права администратора"}), 403
            
        return f(user, *args, **kwargs)
    return decorated


def owner_required(f):
    """Декоратор для проверки, что пользователь является владельцем"""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"message": "Пользователь не найден"}), 401
            
        if not user.is_active:
            return jsonify({"message": "Аккаунт деактивирован"}), 403
            
        if user.role != UserRole.ADMIN and user.role != UserRole.OWNER:
            return jsonify({"message": "Доступ запрещен. Требуются права владельца"}), 403
            
        return f(user, *args, **kwargs)
    return decorated


def generate_tokens(user):
    """Создание токенов доступа и обновления для пользователя"""
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value
        }
    } 