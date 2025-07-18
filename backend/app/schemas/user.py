from marshmallow import fields, validate, validates, ValidationError
from app.schemas import ma
from app.models.user import User, UserRole


class UserSchema(ma.SQLAlchemyAutoSchema):
    """Схема для сериализации пользователя"""
    class Meta:
        model = User
        exclude = ("password_hash",)
    
    role = fields.Enum(UserRole, by_value=True)


class UserLoginSchema(ma.Schema):
    """Схема для авторизации пользователя"""
    email = fields.Email(required=True)
    password = fields.String(required=True)


class UserRegisterSchema(ma.Schema):
    """Схема для регистрации пользователя"""
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=6))
    name = fields.String(required=True)
    role = fields.Enum(UserRole, by_value=True, default=UserRole.EMPLOYEE.value)
    phone = fields.String(validate=validate.Length(max=20))

    @validates("email")
    def validate_email(self, value):
        """Проверка уникальности email"""
        user = User.query.filter_by(email=value).first()
        if user:
            raise ValidationError("Пользователь с таким email уже существует")


class UserUpdateSchema(ma.Schema):
    """Схема для обновления пользователя"""
    name = fields.String()
    phone = fields.String(validate=validate.Length(max=20))
    password = fields.String(validate=validate.Length(min=6))
    is_active = fields.Boolean()
    role = fields.Enum(UserRole, by_value=True) 