from flask import jsonify
from marshmallow import ValidationError


class APIError(Exception):
    """Базовый класс для API ошибок"""
    status_code = 400
    
    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload
        
    def to_dict(self):
        rv = dict(self.payload or {})
        rv['message'] = self.message
        return rv


class NotFoundError(APIError):
    """Ошибка 404 - ресурс не найден"""
    status_code = 404


class ValidationAPIError(APIError):
    """Ошибка валидации данных"""
    status_code = 400


class AuthError(APIError):
    """Ошибка авторизации"""
    status_code = 401


class ForbiddenError(APIError):
    """Доступ запрещен"""
    status_code = 403


def register_error_handlers(app):
    """Регистрация обработчиков ошибок в приложении Flask"""
    
    @app.errorhandler(APIError)
    def handle_api_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response
    
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"message": "Ресурс не найден"}), 404
    
    @app.errorhandler(ValidationError)
    def validation_error(error):
        return jsonify({
            "message": "Ошибка валидации данных", 
            "errors": error.messages
        }), 400
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"message": "Внутренняя ошибка сервера"}), 500
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        return jsonify({"message": f"Непредвиденная ошибка: {str(error)}"}), 500 