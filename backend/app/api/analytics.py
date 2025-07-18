from flask import Blueprint, jsonify, request, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from ..core.auth import admin_required, owner_required
from ..models.user import User
from ..models.inventory import Product
from ..models.order import Order, OrderItem
from ..db.session import db_session
from ..services.ml_forecasting import get_forecaster

analytics_bp = Blueprint('analytics', __name__, url_prefix='/analytics')
logger = logging.getLogger(__name__)

@analytics_bp.route('/forecast/<int:product_id>', methods=['GET'])
@owner_required
def get_forecast(product_id):
    """
    Получение прогноза запасов для конкретного продукта
    """
    try:
        days = request.args.get('days', 30, type=int)
        
        # Проверяем существование продукта
        with db_session() as session:
            product = session.query(Product).filter_by(id=product_id).first()
            if not product:
                abort(404, description="Товар не найден")
        
        # Получаем прогноз
        forecaster = get_forecaster()
        forecasts = forecaster.predict_future_demand(product_id, days_ahead=days)
        
        return jsonify(forecasts)
    except Exception as e:
        logger.error(f"Ошибка при получении прогноза: {str(e)}")
        abort(500, description=f"Ошибка при получении прогноза: {str(e)}")

@analytics_bp.route('/restock-recommendations', methods=['GET'])
@owner_required
def get_restock_recommendations():
    """
    Получение рекомендаций по пополнению запасов
    """
    try:
        forecaster = get_forecaster()
        recommendations = forecaster.get_restock_recommendations()
        
        return jsonify(recommendations)
    except Exception as e:
        logger.error(f"Ошибка при получении рекомендаций: {str(e)}")
        abort(500, description=f"Ошибка при получении рекомендаций: {str(e)}")

@analytics_bp.route('/train-model', methods=['POST'])
@owner_required
def train_model():
    """
    Обучение модели прогнозирования
    """
    try:
        data = request.get_json() or {}
        product_id = data.get('product_id')
        
        # Если product_id присутствует, преобразуем его к int
        if product_id is not None:
            product_id = int(product_id)
        
        forecaster = get_forecaster()
        success = forecaster.train(product_id=product_id)
        
        if not success:
            abort(400, description="Недостаточно данных для обучения модели")
        
        return jsonify({"message": "Модель успешно обучена"})
    except Exception as e:
        logger.error(f"Ошибка при обучении модели: {str(e)}")
        abort(500, description=f"Ошибка при обучении модели: {str(e)}")

@analytics_bp.route('/sales-trends', methods=['GET'])
@jwt_required()
def get_sales_trends():
    """
    Получение трендов продаж за указанный период
    """
    try:
        period = request.args.get('period', 30, type=int)
        
        # Определение даты начала периода
        start_date = datetime.now() - timedelta(days=period)
        
        with db_session() as session:
            # Получение заказов за период
            orders = session.query(Order).filter(
                Order.created_at >= start_date,
                Order.order_type == 'outgoing',  # Только исходящие заказы (продажи)
                Order.status.in_(['completed', 'processing'])  # Только завершенные и обрабатываемые заказы
            ).all()
            
            # Группировка по дате
            sales_by_date = {}
            for order in orders:
                date_str = order.created_at.strftime('%Y-%m-%d')
                if date_str not in sales_by_date:
                    sales_by_date[date_str] = {
                        'date': date_str,
                        'total_sales': 0,
                        'order_count': 0
                    }
                
                sales_by_date[date_str]['total_sales'] += order.total_amount
                sales_by_date[date_str]['order_count'] += 1
            
            # Заполнение пропущенных дат
            result = []
            current_date = start_date
            end_date = datetime.now()
            
            while current_date <= end_date:
                date_str = current_date.strftime('%Y-%m-%d')
                if date_str in sales_by_date:
                    result.append(sales_by_date[date_str])
                else:
                    result.append({
                        'date': date_str,
                        'total_sales': 0,
                        'order_count': 0
                    })
                
                current_date += timedelta(days=1)
            
            return jsonify(result)
    except Exception as e:
        logger.error(f"Ошибка при получении трендов продаж: {str(e)}")
        abort(500, description=f"Ошибка при получении трендов продаж: {str(e)}")

@analytics_bp.route('/category-distribution', methods=['GET'])
@jwt_required()
def get_category_distribution():
    """
    Получение распределения товаров по категориям
    """
    try:
        with db_session() as session:
            # Получение всех товаров
            inventory_items = session.query(Product).all()
            
            # Группировка по категориям
            categories = {}
            for item in inventory_items:
                if not item.category:
                    continue
                
                category_name = item.category.name
                if category_name not in categories:
                    categories[category_name] = 0
                
                categories[category_name] += 1
            
            # Расчет процентного соотношения
            total_items = sum(categories.values())
            
            result = []
            for category, count in categories.items():
                percentage = (count / total_items) * 100 if total_items > 0 else 0
                result.append({
                    'category': category,
                    'value': count,
                    'percentage': percentage
                })
            
            # Сортировка по убыванию количества
            result.sort(key=lambda x: x['value'], reverse=True)
            
            return jsonify(result)
    except Exception as e:
        logger.error(f"Ошибка при получении распределения по категориям: {str(e)}")
        abort(500, description=f"Ошибка при получении распределения по категориям: {str(e)}")

@analytics_bp.route('/top-products', methods=['GET'])
@jwt_required()
def get_top_products():
    """
    Получение топ продаваемых товаров за указанный период
    """
    try:
        period = request.args.get('period', 30, type=int)
        
        # Определение даты начала периода
        start_date = datetime.now() - timedelta(days=period)
        
        with db_session() as session:
            # Получение заказов за период
            orders = session.query(Order).filter(
                Order.created_at >= start_date,
                Order.order_type == 'outgoing',  # Только исходящие заказы (продажи)
                Order.status.in_(['completed', 'processing'])  # Только завершенные и обрабатываемые заказы
            ).all()
            
            # Подсчет продаж по товарам
            product_sales = {}
            
            for order in orders:
                for item in order.items:
                    product_id = item.product_id
                    product = session.query(Product).filter_by(id=product_id).first()
                    
                    if not product:
                        continue
                    
                    if product_id not in product_sales:
                        product_sales[product_id] = {
                            'product_id': product_id,
                            'product_name': product.name,
                            'quantity_sold': 0,
                            'revenue': 0
                        }
                    
                    product_sales[product_id]['quantity_sold'] += item.quantity
                    product_sales[product_id]['revenue'] += item.quantity * item.unit_price
            
            # Преобразование в список и сортировка по выручке
            result = list(product_sales.values())
            result.sort(key=lambda x: x['revenue'], reverse=True)
            
            return jsonify(result)
    except Exception as e:
        logger.error(f"Ошибка при получении топ продуктов: {str(e)}")
        abort(500, description=f"Ошибка при получении топ продуктов: {str(e)}")

@analytics_bp.route('/dashboard-stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """
    Получение статистики для панели управления
    """
    try:
        # Определение дат для разных периодов
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        start_of_month = datetime(today.year, today.month, 1).date()
        start_of_prev_month = (datetime(today.year, today.month, 1) - timedelta(days=1)).replace(day=1).date()
        end_of_prev_month = datetime(today.year, today.month, 1) - timedelta(days=1)
        
        with db_session() as session:
            # Статистика продаж
            sales_today = session.query(Order).filter(
                Order.created_at >= datetime.combine(today, datetime.min.time()),
                Order.order_type == 'outgoing',
                Order.status.in_(['completed', 'processing'])
            ).all()
            
            sales_yesterday = session.query(Order).filter(
                Order.created_at >= datetime.combine(yesterday, datetime.min.time()),
                Order.created_at < datetime.combine(today, datetime.min.time()),
                Order.order_type == 'outgoing',
                Order.status.in_(['completed', 'processing'])
            ).all()
            
            sales_this_month = session.query(Order).filter(
                Order.created_at >= datetime.combine(start_of_month, datetime.min.time()),
                Order.order_type == 'outgoing',
                Order.status.in_(['completed', 'processing'])
            ).all()
            
            sales_prev_month = session.query(Order).filter(
                Order.created_at >= datetime.combine(start_of_prev_month, datetime.min.time()),
                Order.created_at < datetime.combine(start_of_month, datetime.min.time()),
                Order.order_type == 'outgoing',
                Order.status.in_(['completed', 'processing'])
            ).all()
            
            # Статистика запасов
            total_inventory = session.query(Product).count()
            low_stock_items = session.query(Product).filter(
                Product.quantity <= Product.min_threshold
            ).count()
            
            # Статистика заказов
            pending_orders = session.query(Order).filter(
                Order.status == 'pending'
            ).count()
            
            # Расчет значений
            total_sales_today = sum(order.total_amount for order in sales_today)
            total_sales_yesterday = sum(order.total_amount for order in sales_yesterday)
            total_sales_this_month = sum(order.total_amount for order in sales_this_month)
            total_sales_prev_month = sum(order.total_amount for order in sales_prev_month)
            
            # Расчет изменений в процентах
            sales_change_daily = ((total_sales_today - total_sales_yesterday) / total_sales_yesterday * 100) if total_sales_yesterday > 0 else 0
            sales_change_monthly = ((total_sales_this_month - total_sales_prev_month) / total_sales_prev_month * 100) if total_sales_prev_month > 0 else 0
            
            return jsonify({
                "sales": {
                    "today": total_sales_today,
                    "yesterday": total_sales_yesterday,
                    "this_month": total_sales_this_month,
                    "prev_month": total_sales_prev_month,
                    "daily_change_percent": sales_change_daily,
                    "monthly_change_percent": sales_change_monthly
                },
                "inventory": {
                    "total_items": total_inventory,
                    "low_stock_items": low_stock_items,
                    "low_stock_percent": (low_stock_items / total_inventory * 100) if total_inventory > 0 else 0
                },
                "orders": {
                    "pending_count": pending_orders,
                    "today_count": len(sales_today)
                }
            })
    except Exception as e:
        logger.error(f"Ошибка при получении статистики: {str(e)}")
        abort(500, description=f"Ошибка при получении статистики: {str(e)}") 