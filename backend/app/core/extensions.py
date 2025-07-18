from flask import Flask
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Инициализация расширений
db = SQLAlchemy()
migrate = Migrate()
ma = Marshmallow()
jwt = JWTManager()

def init_extensions(app: Flask) -> None:
    """
    Инициализация всех расширений Flask
    
    Args:
        app: Экземпляр приложения Flask
    """
    # Инициализация базы данных
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Инициализация Marshmallow
    ma.init_app(app)
    
    # Инициализация JWT
    jwt.init_app(app)
    
    # Добавляем обработчики ошибок JWT
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        from flask import jsonify
        return jsonify({
            "message": "Срок действия токена истек",
            "error": "token_expired"
        }), 401
        
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        from flask import jsonify
        return jsonify({
            "message": "Некорректный токен",
            "error": "invalid_token"
        }), 401
        
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        from flask import jsonify
        return jsonify({
            "message": "Требуется авторизация",
            "error": "authorization_required"
        }), 401
        
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        from flask import jsonify
        return jsonify({
            "message": "Токен отозван",
            "error": "token_revoked"
        }), 401 