from marshmallow import fields, validate, validates, ValidationError
from app.schemas import ma
from app.models.inventory import Category, Supplier, Product, InventoryLog


class CategorySchema(ma.SQLAlchemyAutoSchema):
    """Схема для категорий товаров"""
    class Meta:
        model = Category


class SupplierSchema(ma.SQLAlchemyAutoSchema):
    """Схема для поставщиков"""
    class Meta:
        model = Supplier


class ProductSchema(ma.SQLAlchemyAutoSchema):
    """Схема для товаров"""
    class Meta:
        model = Product
        include_fk = True
    
    category = fields.Nested(CategorySchema, exclude=("products",))
    supplier = fields.Nested(SupplierSchema, exclude=("products", "orders"))
    is_low_stock = fields.Method("get_is_low_stock")
    
    def get_is_low_stock(self, obj):
        """Проверка низкого запаса товара"""
        return obj.quantity <= obj.min_stock


class ProductCreateSchema(ma.Schema):
    """Схема для создания товара"""
    name = fields.String(required=True)
    sku = fields.String(required=True)
    description = fields.String()
    price = fields.Float(required=True, validate=validate.Range(min=0))
    quantity = fields.Integer(required=True, validate=validate.Range(min=0))
    min_stock = fields.Integer(validate=validate.Range(min=0), default=5)
    category_id = fields.Integer()
    supplier_id = fields.Integer()

    @validates("sku")
    def validate_sku(self, value):
        """Проверка уникальности SKU"""
        product = Product.query.filter_by(sku=value).first()
        if product:
            raise ValidationError("Товар с таким SKU уже существует")


class ProductUpdateSchema(ma.Schema):
    """Схема для обновления товара"""
    name = fields.String()
    description = fields.String()
    price = fields.Float(validate=validate.Range(min=0))
    quantity = fields.Integer(validate=validate.Range(min=0))
    min_stock = fields.Integer(validate=validate.Range(min=0))
    category_id = fields.Integer()
    supplier_id = fields.Integer()


class InventoryLogSchema(ma.SQLAlchemyAutoSchema):
    """Схема для логов изменения запасов"""
    class Meta:
        model = InventoryLog
        include_fk = True
    
    product = fields.Nested(ProductSchema, only=("id", "name", "sku"))
    user = fields.Nested('UserSchema', only=("id", "name", "email")) 