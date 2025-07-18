from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity, jwt_required, create_access_token
from marshmallow import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.models import User, UserRole
from app.core.auth import generate_tokens
from app.core.errors import AuthError

# Создание Blueprint для авторизации
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    try:
        # Валидация входящих данных
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
            
        # Получаем схему из конфигурации приложения
        user_register_schema = current_app.config['SCHEMAS']["user_register_schema"]
        data = user_register_schema.load(json_data)
        
        # Создание нового пользователя
        user = User(
            email=data['email'],
            name=data['name'],
            role=UserRole(data.get('role', UserRole.EMPLOYEE.value)),
            phone=data.get('phone')
        )
        user.password = data['password']
        
        try:
            user.save()
        except SQLAlchemyError as e:
            return jsonify({"message": "Ошибка при сохранении пользователя в базу данных", "error": str(e)}), 500
        
        # Генерация токенов
        tokens = generate_tokens(user)
        
        return jsonify({
            "message": "Пользователь успешно зарегистрирован",
            **tokens
        }), 201
        
    except ValidationError as e:
        return jsonify({"message": "Ошибка валидации данных", "errors": e.messages}), 400
    except Exception as e:
        return jsonify({"message": "Произошла ошибка при регистрации", "error": str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Авторизация пользователя"""
    try:
        # Валидация входящих данных
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
            
        # Получаем схему из конфигурации приложения
        user_login_schema = current_app.config['SCHEMAS']["user_login_schema"]
        data = user_login_schema.load(json_data)
        
        # Поиск пользователя по email
        user = User.query.filter_by(email=data['email']).first()
        
        # Проверка наличия пользователя и пароля
        if not user or not user.verify_password(data['password']):
            raise AuthError("Неверный email или пароль")
        
        # Проверка активности аккаунта
        if not user.is_active:
            raise AuthError("Аккаунт деактивирован")
        
        # Генерация токенов
        tokens = generate_tokens(user)
        
        return jsonify({
            "message": "Авторизация успешна",
            **tokens
        }), 200
        
    except ValidationError as e:
        return jsonify({"message": "Ошибка валидации данных", "errors": e.messages}), 400
    except AuthError as e:
        return jsonify({"message": e.message}), e.status_code
    except SQLAlchemyError as e:
        return jsonify({"message": "Ошибка при работе с базой данных", "error": str(e)}), 500
    except Exception as e:
        return jsonify({"message": "Произошла ошибка при авторизации", "error": str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Обновление токена доступа"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"message": "Пользователь не найден"}), 401
        
        if not user.is_active:
            return jsonify({"message": "Аккаунт деактивирован"}), 403
        
        # Генерация только токена доступа
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            "message": "Токен успешно обновлен",
            "access_token": access_token
        }), 200
    except SQLAlchemyError as e:
        return jsonify({"message": "Ошибка при работе с базой данных", "error": str(e)}), 500
    except Exception as e:
        return jsonify({"message": "Произошла ошибка при обновлении токена", "error": str(e)}), 500 