import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from marshmallow import ValidationError
from datetime import datetime

from app.models import Order, OrderItem, OrderFile, Product, OrderStatus
from app.core.auth import token_required, owner_required
from app.core.errors import NotFoundError, ValidationAPIError
from app.db.session import db

# Создание Blueprint для заказов
orders_bp = Blueprint('orders', __name__, url_prefix='/orders')

@orders_bp.route('/', methods=['GET'])
@token_required
def get_orders(current_user):
    """Получение списка заказов с фильтрацией"""
    query = Order.query
    
    # Фильтрация по пользователю (только для обычных сотрудников)
    if current_user.role.value == 'employee':
        query = query.filter_by(user_id=current_user.id)
    
    # Фильтрация по параметрам
    supplier_id = request.args.get('supplier_id')
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if supplier_id:
        query = query.filter_by(supplier_id=supplier_id)
    
    if status:
        query = query.filter_by(status=status)
    
    if start_date:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        query = query.filter(Order.created_at >= start)
    
    if end_date:
        end = datetime.strptime(end_date, '%Y-%m-%d')
        query = query.filter(Order.created_at <= end)
    
    # Сортировка
    query = query.order_by(Order.created_at.desc())
    
    orders = query.all()
    orders_schema = current_app.config['SCHEMAS']["orders_schema"]
    return jsonify(orders_schema.dump(orders)), 200


@orders_bp.route('/', methods=['POST'])
@token_required
def create_order(current_user):
    """Создание нового заказа"""
    try:
        # Валидация входящих данных
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
            
        order_create_schema = current_app.config['SCHEMAS']["order_create_schema"]
        data = order_create_schema.load(json_data)
        
        # Генерация номера заказа
        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}-{datetime.utcnow().strftime('%Y%m%d')}"
        
        # Создание заказа
        order = Order(
            order_number=order_number,
            user_id=current_user.id,
            supplier_id=data['supplier_id'],
            status=OrderStatus.PENDING,
            shipping_address=data.get('shipping_address'),
            notes=data.get('notes'),
            expected_delivery_date=data.get('expected_delivery_date')
        )
        
        # Добавление элементов заказа
        for item_data in data['items']:
            product = Product.query.get(item_data['product_id'])
            if not product:
                raise ValidationAPIError(f"Товар с ID {item_data['product_id']} не найден")
            
            # Проверка наличия достаточного количества товара
            if product.quantity < item_data['quantity']:
                raise ValidationAPIError(f"Недостаточное количество товара {product.name} (доступно: {product.quantity})")
            
            # Создание элемента заказа
            order_item = OrderItem(
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price']
            )
            order.items.append(order_item)
        
        # Расчет общей суммы заказа
        order.calculate_total()
        
        # Сохранение заказа
        db.session.add(order)
        db.session.commit()
        
        order_schema = current_app.config['SCHEMAS']["order_schema"]
        return jsonify({
            "message": "Заказ успешно создан",
            "order": order_schema.dump(order)
        }), 201
        
    except ValidationError as e:
        return jsonify({"message": "Ошибка валидации данных", "errors": e.messages}), 400
    except ValidationAPIError as e:
        return jsonify({"message": e.message}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400


@orders_bp.route('/<int:order_id>', methods=['GET'])
@token_required
def get_order(current_user, order_id):
    """Получение информации о заказе"""
    order = Order.query.get(order_id)
    
    if not order:
        raise NotFoundError("Заказ не найден")
    
    # Проверка доступа (только владельцы и админы могут просматривать чужие заказы)
    if current_user.role.value == 'employee' and order.user_id != current_user.id:
        return jsonify({"message": "Доступ запрещен"}), 403
    
    order_schema = current_app.config['SCHEMAS']["order_schema"]
    return jsonify(order_schema.dump(order)), 200


@orders_bp.route('/<int:order_id>/status', methods=['PUT'])
@token_required
def update_order_status(current_user, order_id):
    """Обновление статуса заказа"""
    order = Order.query.get(order_id)
    
    if not order:
        raise NotFoundError("Заказ не найден")
    
    # Проверка доступа (только владельцы и админы могут обновлять статус)
    if current_user.role.value == 'employee' and order.user_id != current_user.id:
        return jsonify({"message": "Доступ запрещен"}), 403
    
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
        
        if 'status' not in json_data:
            return jsonify({"message": "Необходимо указать статус"}), 400
        
        try:
            new_status = OrderStatus(json_data['status'])
        except ValueError:
            return jsonify({"message": f"Недопустимый статус. Допустимые значения: {[status.value for status in OrderStatus]}"}), 400
        
        # Обновление статуса
        order.status = new_status
        
        # Уменьшение количества товаров при отправке заказа
        if new_status == OrderStatus.SHIPPED and order.status != OrderStatus.SHIPPED:
            for item in order.items:
                product = item.product
                if product.quantity < item.quantity:
                    return jsonify({
                        "message": f"Недостаточное количество товара {product.name} (доступно: {product.quantity}, требуется: {item.quantity})"
                    }), 400
                
                product.quantity -= item.quantity
                db.session.add(product)
        
        # Возврат товаров в случае отмены заказа
        if new_status == OrderStatus.CANCELLED and order.status == OrderStatus.SHIPPED:
            for item in order.items:
                product = item.product
                product.quantity += item.quantity
                db.session.add(product)
        
        db.session.add(order)
        db.session.commit()
        
        order_schema = current_app.config['SCHEMAS']["order_schema"]
        return jsonify({
            "message": "Статус заказа успешно обновлен",
            "order": order_schema.dump(order)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400


@orders_bp.route('/<int:order_id>/files', methods=['POST'])
@token_required
def upload_order_file(current_user, order_id):
    """Загрузка файла к заказу"""
    order = Order.query.get(order_id)
    
    if not order:
        raise NotFoundError("Заказ не найден")
    
    # Проверка доступа (только владельцы и админы могут загружать файлы)
    if current_user.role.value == 'employee' and order.user_id != current_user.id:
        return jsonify({"message": "Доступ запрещен"}), 403
    
    try:
        # Проверка наличия файла
        if 'file' not in request.files:
            return jsonify({"message": "Необходимо загрузить файл"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"message": "Не выбран файл"}), 400
        
        # Создание директории для файлов, если ее нет
        upload_dir = os.path.join(current_app.root_path, 'uploads', 'orders', str(order_id))
        os.makedirs(upload_dir, exist_ok=True)
        
        # Генерация уникального имени файла
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)
        
        # Сохранение файла
        file.save(file_path)
        
        # Сохранение информации о файле в базе данных
        order_file = OrderFile(
            order_id=order.id,
            filename=file.filename,
            file_path=os.path.join('uploads', 'orders', str(order_id), filename),
            file_type=file.content_type
        )
        
        db.session.add(order_file)
        db.session.commit()
        
        return jsonify({
            "message": "Файл успешно загружен",
            "file": {
                "id": order_file.id,
                "filename": order_file.filename,
                "upload_date": order_file.upload_date.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400


@orders_bp.route('/<int:order_id>', methods=['DELETE'])
@owner_required
def delete_order(current_user, order_id):
    """Удаление заказа (только для владельцев и админов)"""
    order = Order.query.get(order_id)
    
    if not order:
        raise NotFoundError("Заказ не найден")
    
    try:
        # Удаление заказа (каскадное удаление элементов и файлов настроено в модели)
        db.session.delete(order)
        db.session.commit()
        
        return jsonify({
            "message": "Заказ успешно удален"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400 