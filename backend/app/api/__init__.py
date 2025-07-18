from flask import Flask, Blueprint
from .auth import auth_bp
from .users import users_bp
from .inventory import inventory_bp
from .orders import orders_bp
from .integrations import integrations_bp
from .analytics import analytics_bp

def init_routes(app: Flask):
    """
    Инициализация всех маршрутов API
    """
    # Создаем общий Blueprint для API с префиксом /api
    api_bp = Blueprint('api', __name__, url_prefix='/api')
    
    # Регистрируем все Blueprint'ы внутри api_bp
    api_bp.register_blueprint(auth_bp)
    api_bp.register_blueprint(users_bp)
    api_bp.register_blueprint(inventory_bp)
    api_bp.register_blueprint(orders_bp)
    api_bp.register_blueprint(integrations_bp)
    api_bp.register_blueprint(analytics_bp)
    
    # Регистрируем основной Blueprint в приложении
    app.register_blueprint(api_bp) 