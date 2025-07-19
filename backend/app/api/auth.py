import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity, jwt_required, create_access_token
from marshmallow import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from ..models import User, UserRole
from ..core.auth import generate_tokens
from ..core.errors import AuthError
from ..core.extensions import db

# Создание логгера
logger = logging.getLogger(__name__)

# Создание Blueprint для авторизации
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    try:
        # Логирование начала процесса регистрации
        logger.info("Начало процесса регистрации")
        
        # Валидация входящих данных
        json_data = request.get_json()
        logger.info(f"Получены данные: {json_data}")
        
        if not json_data:
            logger.error("Отсутствуют данные JSON")
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
            
        # Получаем схему из конфигурации приложения
        user_register_schema = current_app.config['SCHEMAS']["user_register_schema"]
        
        try:
            data = user_register_schema.load(json_data)
            logger.info("Данные успешно прошли валидацию")
        except ValidationError as e:
            logger.error(f"Ошибка валидации данных: {e.messages}")
            return jsonify({"message": "Ошибка валидации данных", "errors": e.messages}), 400
        
        # Создание нового пользователя
        try:
            # Создаем пользователя, используя правильный подход для установки атрибутов
            user = User()
            user.email = data['email']
            user.name = data['name']
            user.role = data.get('role', UserRole.EMPLOYEE.value)
            if 'phone' in data:
                user.phone = data['phone']
                
            # Устанавливаем пароль через сеттер
            user.set_password(data['password'])
            logger.info(f"Создан пользователь с email: {user.email}, роль: {user.role}")
        except Exception as e:
            logger.error(f"Ошибка при создании объекта пользователя: {str(e)}")
            return jsonify({"message": "Ошибка при создании пользователя", "error": str(e)}), 500
        
        try:
            db.session.add(user)
            db.session.commit()
            logger.info(f"Пользователь с email {user.email} успешно сохранен в базе данных")
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Ошибка SQLAlchemy при сохранении пользователя: {str(e)}")
            return jsonify({"message": "Ошибка при сохранении пользователя в базу данных", "error": str(e)}), 500
        
        # Генерация токенов
        try:
            tokens = generate_tokens(user)
            logger.info(f"Токены успешно сгенерированы для пользователя {user.email}")
        except Exception as e:
            logger.error(f"Ошибка при генерации токенов: {str(e)}")
            return jsonify({"message": "Ошибка при генерации токенов", "error": str(e)}), 500
        
        logger.info("Регистрация успешно завершена")
        return jsonify({
            "message": "Пользователь успешно зарегистрирован",
            **tokens
        }), 201
        
    except ValidationError as e:
        logger.error(f"Ошибка валидации данных: {e.messages}")
        return jsonify({"message": "Ошибка валидации данных", "errors": e.messages}), 400
    except Exception as e:
        logger.error(f"Необработанная ошибка при регистрации: {str(e)}")
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