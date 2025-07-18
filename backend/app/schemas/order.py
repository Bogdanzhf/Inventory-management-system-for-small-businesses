from marshmallow import fields, validate, validates, ValidationError
from app.schemas import ma
from app.models.order import Order, OrderItem, OrderFile, OrderStatus


class OrderItemSchema(ma.SQLAlchemyAutoSchema):
    """Схема для элементов заказа"""
    class Meta:
        model = OrderItem
        include_fk = True
    
    product = fields.Nested('ProductSchema', only=("id", "name", "sku", "price"))
    total_price = fields.Float()


class OrderItemCreateSchema(ma.Schema):
    """Схема для создания элемента заказа"""
    product_id = fields.Integer(required=True)
    quantity = fields.Integer(required=True, validate=validate.Range(min=1))
    unit_price = fields.Float(required=True, validate=validate.Range(min=0))


class OrderFileSchema(ma.SQLAlchemyAutoSchema):
    """Схема для файлов заказа"""
    class Meta:
        model = OrderFile
        include_fk = True


class OrderSchema(ma.SQLAlchemyAutoSchema):
    """Схема для заказов"""
    class Meta:
        model = Order
        include_fk = True
    
    user = fields.Nested('UserSchema', only=("id", "name", "email"))
    supplier = fields.Nested('SupplierSchema')
    status = fields.Enum(OrderStatus, by_value=True)
    items = fields.Nested(OrderItemSchema, many=True)
    files = fields.Nested(OrderFileSchema, many=True)


class OrderCreateSchema(ma.Schema):
    """Схема для создания заказа"""
    supplier_id = fields.Integer(required=True)
    shipping_address = fields.String()
    notes = fields.String()
    expected_delivery_date = fields.DateTime()
    items = fields.List(fields.Nested(OrderItemCreateSchema), required=True, validate=validate.Length(min=1))
    
    @validates("items")
    def validate_items(self, items):
        """Проверка, что есть хотя бы один элемент заказа"""
        if not items:
            raise ValidationError("Заказ должен содержать хотя бы один товар") 