from marshmallow import fields, validate, validates, ValidationError, post_load, validates_schema
import logging
from app.schemas import ma
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

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
        logger.debug(f"Проверка email на уникальность: {value}")
        user = User.query.filter_by(email=value).first()
        if user:
            logger.warning(f"Пользователь с email {value} уже существует")
            raise ValidationError("Пользователь с таким email уже существует")
    
    @post_load
    def log_data(self, data, **kwargs):
        """Логирование данных после валидации"""
        logger.debug(f"Данные после валидации: {data}")
        return data
    
    @validates_schema
    def validate_schema(self, data, **kwargs):
        """Дополнительная валидация данных"""
        logger.debug(f"Валидация всех данных схемы: {data}")
        # Здесь можно добавить дополнительные проверки


class UserUpdateSchema(ma.Schema):
    """Схема для обновления пользователя"""
    name = fields.String()
    phone = fields.String(validate=validate.Length(max=20))
    password = fields.String(validate=validate.Length(min=6))
    is_active = fields.Boolean()
    role = fields.Enum(UserRole, by_value=True) 