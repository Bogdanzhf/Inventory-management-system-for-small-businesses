from flask_marshmallow import Marshmallow

# Инициализация Marshmallow
ma = Marshmallow()

# Функция для регистрации схем после инициализации приложения
def register_schemas():
    """
    Регистрирует все схемы после инициализации приложения.
    Эта функция вызывается в app/main.py после инициализации Marshmallow.
    """
    # Импорты здесь для избегания циклических зависимостей
    from app.schemas.user import UserSchema, UserLoginSchema, UserRegisterSchema, UserUpdateSchema
    from app.schemas.inventory import (
        CategorySchema, 
        SupplierSchema, 
        ProductSchema, 
        ProductCreateSchema,
        ProductUpdateSchema, 
        InventoryLogSchema
    )
    from app.schemas.order import (
        OrderSchema, 
        OrderCreateSchema, 
        OrderItemSchema,
        OrderItemCreateSchema, 
        OrderFileSchema
    )
    
    # Возвращаем словарь схем для использования в приложении
    return {
        # Схемы пользователей
        "user_schema": UserSchema(),
        "users_schema": UserSchema(many=True),
        "user_login_schema": UserLoginSchema(),
        "user_register_schema": UserRegisterSchema(),
        "user_update_schema": UserUpdateSchema(),
        
        # Схемы инвентаря
        "category_schema": CategorySchema(),
        "categories_schema": CategorySchema(many=True),
        "supplier_schema": SupplierSchema(),
        "suppliers_schema": SupplierSchema(many=True),
        "product_schema": ProductSchema(),
        "products_schema": ProductSchema(many=True),
        "product_create_schema": ProductCreateSchema(),
        "product_update_schema": ProductUpdateSchema(),
        "inventory_log_schema": InventoryLogSchema(),
        "inventory_logs_schema": InventoryLogSchema(many=True),
        
        # Схемы заказов
        "order_schema": OrderSchema(),
        "orders_schema": OrderSchema(many=True),
        "order_create_schema": OrderCreateSchema(),
        "order_item_schema": OrderItemSchema(),
        "order_item_create_schema": OrderItemCreateSchema(),
        "order_file_schema": OrderFileSchema()
    }

# Экспортируем все схемы для использования в других модулях
__all__ = ["ma", "register_schemas"] 