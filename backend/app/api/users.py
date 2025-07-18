from flask import Blueprint, request, jsonify, current_app
from marshmallow import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.models import User
from app.core.auth import token_required, admin_required
from app.core.errors import NotFoundError

# Создание Blueprint для пользователей
users_bp = Blueprint('users', __name__, url_prefix='/users')

@users_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Получение профиля текущего пользователя"""
    user_schema = current_app.config['SCHEMAS']["user_schema"]
    return jsonify(user_schema.dump(current_user)), 200


@users_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Обновление профиля текущего пользователя"""
    try:
        # Валидация входящих данных
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
            
        user_update_schema = current_app.config['SCHEMAS']["user_update_schema"]
        data = user_update_schema.load(json_data)
        
        # Обновление полей пользователя
        for key, value in data.items():
            if key == 'password':
                current_user.password = value
            else:
                setattr(current_user, key, value)
        
        # Сохранение изменений
        try:
            current_user.save()
        except SQLAlchemyError as e:
            return jsonify({"message": "Ошибка при сохранении профиля в базу данных", "error": str(e)}), 500
        
        user_schema = current_app.config['SCHEMAS']["user_schema"]
        return jsonify({
            "message": "Профиль успешно обновлен",
            "user": user_schema.dump(current_user)
        }), 200
        
    except ValidationError as e:
        return jsonify({"message": "Ошибка валидации данных", "errors": e.messages}), 400
    except Exception as e:
        return jsonify({"message": "Произошла ошибка при обновлении профиля", "error": str(e)}), 500


@users_bp.route('/', methods=['GET'])
@admin_required
def get_users(current_user):
    """Получение списка всех пользователей (только для админов)"""
    try:
        users = User.query.all()
        users_schema = current_app.config['SCHEMAS']["users_schema"]
        return jsonify(users_schema.dump(users)), 200
    except SQLAlchemyError as e:
        return jsonify({"message": "Ошибка при получении списка пользователей", "error": str(e)}), 500
    except Exception as e:
        return jsonify({"message": "Произошла ошибка при получении списка пользователей", "error": str(e)}), 500


@users_bp.route('/<int:user_id>', methods=['GET'])
@admin_required
def get_user(current_user, user_id):
    """Получение информации о пользователе (только для админов)"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            raise NotFoundError("Пользователь не найден")
        
        user_schema = current_app.config['SCHEMAS']["user_schema"]
        return jsonify(user_schema.dump(user)), 200
    except NotFoundError as e:
        return jsonify({"message": e.message}), e.status_code
    except SQLAlchemyError as e:
        return jsonify({"message": "Ошибка при получении информации о пользователе", "error": str(e)}), 500
    except Exception as e:
        return jsonify({"message": "Произошла ошибка при получении информации о пользователе", "error": str(e)}), 500


@users_bp.route('/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(current_user, user_id):
    """Обновление пользователя (только для админов)"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            raise NotFoundError("Пользователь не найден")
        
        # Валидация входящих данных
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
            
        user_update_schema = current_app.config['SCHEMAS']["user_update_schema"]
        data = user_update_schema.load(json_data)
        
        # Обновление полей пользователя
        for key, value in data.items():
            if key == 'password':
                user.password = value
            else:
                setattr(user, key, value)
        
        # Сохранение изменений
        try:
            user.save()
        except SQLAlchemyError as e:
            return jsonify({"message": "Ошибка при сохранении пользователя в базу данных", "error": str(e)}), 500
        
        user_schema = current_app.config['SCHEMAS']["user_schema"]
        return jsonify({
            "message": "Пользователь успешно обновлен",
            "user": user_schema.dump(user)
        }), 200
        
    except ValidationError as e:
        return jsonify({"message": "Ошибка валидации данных", "errors": e.messages}), 400
    except NotFoundError as e:
        return jsonify({"message": e.message}), e.status_code
    except Exception as e:
        return jsonify({"message": "Произошла ошибка при обновлении пользователя", "error": str(e)}), 500 