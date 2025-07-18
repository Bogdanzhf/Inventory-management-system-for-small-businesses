from flask import Blueprint, request, jsonify, current_app
from marshmallow import ValidationError
from sqlalchemy import or_

from app.models import Product, Category, Supplier, InventoryLog
from app.core.auth import token_required, owner_required
from app.core.errors import NotFoundError
from app.db.session import db

# Создание Blueprint для инвентаря
inventory_bp = Blueprint('inventory', __name__, url_prefix='/inventory')

# Маршруты для категорий
@inventory_bp.route('/categories', methods=['GET'])
@token_required
def get_categories(current_user):
    """Получение списка всех категорий"""
    categories = Category.query.all()
    categories_schema = current_app.config['SCHEMAS']["categories_schema"]
    return jsonify(categories_schema.dump(categories)), 200


@inventory_bp.route('/categories', methods=['POST'])
@owner_required
def create_category(current_user):
    """Создание новой категории"""
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
        
        # Проверка наличия обязательных полей
        if not json_data.get('name'):
            return jsonify({"message": "Имя категории обязательно"}), 400
        
        # Проверка уникальности имени
        existing = Category.query.filter_by(name=json_data['name']).first()
        if existing:
            return jsonify({"message": "Категория с таким именем уже существует"}), 400
        
        # Создание категории
        category = Category(
            name=json_data['name'],
            description=json_data.get('description')
        )
        category.save()
        
        category_schema = current_app.config['SCHEMAS']["category_schema"]
        return jsonify({
            "message": "Категория успешно создана",
            "category": category_schema.dump(category)
        }), 201
        
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@inventory_bp.route('/categories/<int:category_id>', methods=['PUT'])
@owner_required
def update_category(current_user, category_id):
    """Обновление категории"""
    category = Category.query.get(category_id)
    
    if not category:
        raise NotFoundError("Категория не найдена")
    
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
        
        # Проверка уникальности имени если оно изменяется
        if 'name' in json_data and json_data['name'] != category.name:
            existing = Category.query.filter_by(name=json_data['name']).first()
            if existing:
                return jsonify({"message": "Категория с таким именем уже существует"}), 400
        
        # Обновление полей
        if 'name' in json_data:
            category.name = json_data['name']
        if 'description' in json_data:
            category.description = json_data['description']
        
        category.save()
        
        category_schema = current_app.config['SCHEMAS']["category_schema"]
        return jsonify({
            "message": "Категория успешно обновлена",
            "category": category_schema.dump(category)
        }), 200
        
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@inventory_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@owner_required
def delete_category(current_user, category_id):
    """Удаление категории"""
    category = Category.query.get(category_id)
    
    if not category:
        raise NotFoundError("Категория не найдена")
    
    # Проверка, используется ли категория в товарах
    if category.products.count() > 0:
        return jsonify({
            "message": "Нельзя удалить категорию, связанную с товарами"
        }), 400
    
    category.delete()
    
    return jsonify({
        "message": "Категория успешно удалена"
    }), 200


# Маршруты для поставщиков
@inventory_bp.route('/suppliers', methods=['GET'])
@token_required
def get_suppliers(current_user):
    """Получение списка всех поставщиков"""
    suppliers = Supplier.query.all()
    suppliers_schema = current_app.config['SCHEMAS']["suppliers_schema"]
    return jsonify(suppliers_schema.dump(suppliers)), 200


@inventory_bp.route('/suppliers', methods=['POST'])
@owner_required
def create_supplier(current_user):
    """Создание нового поставщика"""
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
        
        # Проверка наличия обязательных полей
        if not json_data.get('name'):
            return jsonify({"message": "Имя поставщика обязательно"}), 400
        
        # Создание поставщика
        supplier = Supplier(
            name=json_data['name'],
            email=json_data.get('email'),
            phone=json_data.get('phone'),
            address=json_data.get('address'),
            contact_person=json_data.get('contact_person')
        )
        supplier.save()
        
        supplier_schema = current_app.config['SCHEMAS']["supplier_schema"]
        return jsonify({
            "message": "Поставщик успешно создан",
            "supplier": supplier_schema.dump(supplier)
        }), 201
        
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@inventory_bp.route('/suppliers/<int:supplier_id>', methods=['PUT'])
@owner_required
def update_supplier(current_user, supplier_id):
    """Обновление поставщика"""
    supplier = Supplier.query.get(supplier_id)
    
    if not supplier:
        raise NotFoundError("Поставщик не найден")
    
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
        
        # Обновление полей
        for field in ['name', 'email', 'phone', 'address', 'contact_person']:
            if field in json_data:
                setattr(supplier, field, json_data[field])
        
        supplier.save()
        
        supplier_schema = current_app.config['SCHEMAS']["supplier_schema"]
        return jsonify({
            "message": "Поставщик успешно обновлен",
            "supplier": supplier_schema.dump(supplier)
        }), 200
        
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@inventory_bp.route('/suppliers/<int:supplier_id>', methods=['DELETE'])
@owner_required
def delete_supplier(current_user, supplier_id):
    """Удаление поставщика"""
    supplier = Supplier.query.get(supplier_id)
    
    if not supplier:
        raise NotFoundError("Поставщик не найден")
    
    # Проверка, используется ли поставщик в товарах или заказах
    if supplier.products.count() > 0 or supplier.orders.count() > 0:
        return jsonify({
            "message": "Нельзя удалить поставщика, связанного с товарами или заказами"
        }), 400
    
    supplier.delete()
    
    return jsonify({
        "message": "Поставщик успешно удален"
    }), 200


# Маршруты для товаров
@inventory_bp.route('/products', methods=['GET'])
@token_required
def get_products(current_user):
    """Получение списка товаров с фильтрацией"""
    query = Product.query
    
    # Фильтрация по параметрам
    category_id = request.args.get('category_id')
    supplier_id = request.args.get('supplier_id')
    search = request.args.get('search')
    low_stock = request.args.get('low_stock')
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    if supplier_id:
        query = query.filter_by(supplier_id=supplier_id)
    
    if search:
        query = query.filter(or_(
            Product.name.ilike(f"%{search}%"),
            Product.sku.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%")
        ))
    
    if low_stock:
        query = query.filter(Product.quantity <= Product.min_stock)
    
    # Сортировка
    sort_by = request.args.get('sort_by', 'name')
    sort_order = request.args.get('sort_order', 'asc')
    
    if sort_order == 'desc':
        query = query.order_by(getattr(Product, sort_by).desc())
    else:
        query = query.order_by(getattr(Product, sort_by))
    
    products = query.all()
    products_schema = current_app.config['SCHEMAS']["products_schema"]
    return jsonify(products_schema.dump(products)), 200


@inventory_bp.route('/products', methods=['POST'])
@owner_required
def create_product(current_user):
    """Создание нового товара"""
    try:
        # Валидация входящих данных
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
            
        product_create_schema = current_app.config['SCHEMAS']["product_create_schema"]
        data = product_create_schema.load(json_data)
        
        # Создание товара
        product = Product(
            name=data['name'],
            sku=data['sku'],
            description=data.get('description', ''),
            price=data['price'],
            quantity=data['quantity'],
            min_stock=data.get('min_stock', 5),
            category_id=data.get('category_id'),
            supplier_id=data.get('supplier_id')
        )
        product.save()
        
        # Создание лога изменения запасов
        if data['quantity'] > 0:
            log = InventoryLog(
                product_id=product.id,
                user_id=current_user.id,
                quantity_change=data['quantity'],
                comment="Начальное поступление товара"
            )
            log.save()
        
        product_schema = current_app.config['SCHEMAS']["product_schema"]
        return jsonify({
            "message": "Товар успешно создан",
            "product": product_schema.dump(product)
        }), 201
        
    except ValidationError as e:
        return jsonify({"message": "Ошибка валидации данных", "errors": e.messages}), 400
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@inventory_bp.route('/products/<int:product_id>', methods=['GET'])
@token_required
def get_product(current_user, product_id):
    """Получение информации о товаре"""
    product = Product.query.get(product_id)
    
    if not product:
        raise NotFoundError("Товар не найден")
    
    product_schema = current_app.config['SCHEMAS']["product_schema"]
    return jsonify(product_schema.dump(product)), 200


@inventory_bp.route('/products/<int:product_id>', methods=['PUT'])
@owner_required
def update_product(current_user, product_id):
    """Обновление товара"""
    product = Product.query.get(product_id)
    
    if not product:
        raise NotFoundError("Товар не найден")
    
    try:
        # Валидация входящих данных
        json_data = request.get_json()
        if not json_data:
            return jsonify({"message": "Отсутствуют данные JSON"}), 400
            
        product_update_schema = current_app.config['SCHEMAS']["product_update_schema"]
        data = product_update_schema.load(json_data)
        
        # Проверка изменения количества
        old_quantity = product.quantity
        new_quantity = data.get('quantity', old_quantity)
        quantity_change = new_quantity - old_quantity
        
        # Обновление полей товара
        for key, value in data.items():
            setattr(product, key, value)
        
        product.save()
        
        # Создание лога изменения запасов при изменении количества
        if quantity_change != 0:
            log = InventoryLog(
                product_id=product.id,
                user_id=current_user.id,
                quantity_change=quantity_change,
                comment=data.get('comment', "Обновление количества товара")
            )
            log.save()
        
        product_schema = current_app.config['SCHEMAS']["product_schema"]
        return jsonify({
            "message": "Товар успешно обновлен",
            "product": product_schema.dump(product)
        }), 200
        
    except ValidationError as e:
        return jsonify({"message": "Ошибка валидации данных", "errors": e.messages}), 400
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@inventory_bp.route('/products/<int:product_id>', methods=['DELETE'])
@owner_required
def delete_product(current_user, product_id):
    """Удаление товара"""
    product = Product.query.get(product_id)
    
    if not product:
        raise NotFoundError("Товар не найден")
    
    # Проверка, используется ли товар в заказах
    if product.order_items.count() > 0:
        return jsonify({
            "message": "Нельзя удалить товар, связанный с заказами"
        }), 400
    
    product.delete()
    
    return jsonify({
        "message": "Товар успешно удален"
    }), 200


@inventory_bp.route('/products/<int:product_id>/inventory_logs', methods=['GET'])
@token_required
def get_product_logs(current_user, product_id):
    """Получение истории изменений запасов товара"""
    product = Product.query.get(product_id)
    
    if not product:
        raise NotFoundError("Товар не найден")
    
    logs = InventoryLog.query.filter_by(product_id=product_id).order_by(InventoryLog.created_at.desc()).all()
    inventory_logs_schema = current_app.config['SCHEMAS']["inventory_logs_schema"]
    return jsonify(inventory_logs_schema.dump(logs)), 200


@inventory_bp.route('/low_stock', methods=['GET'])
@token_required
def get_low_stock(current_user):
    """Получение списка товаров с низким запасом"""
    products = db.session.query(Product).filter(Product.quantity <= Product.min_stock).all()
    products_schema = current_app.config['SCHEMAS']["products_schema"]
    
    return jsonify({
        "count": len(products),
        "products": products_schema.dump(products)
    }), 200 