"""
Инициализация базы данных
"""
import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..models.user import User
from ..models.inventory import Category, Supplier
from ..core.security import get_password_hash

logger = logging.getLogger(__name__)

# Начальные категории товаров
INITIAL_CATEGORIES = [
    {"name": "Электроника", "description": "Электронные устройства и компоненты"},
    {"name": "Канцелярия", "description": "Канцелярские товары"},
    {"name": "Мебель", "description": "Офисная и домашняя мебель"},
    {"name": "Продукты", "description": "Продукты питания"},
    {"name": "Одежда", "description": "Одежда и аксессуары"}
]

# Начальные поставщики
INITIAL_SUPPLIERS = [
    {"name": "ООО 'ТехноПоставка'", "contact_info": "info@techno.ru", "address": "г. Москва, ул. Ленина, 10"},
    {"name": "ИП Иванов", "contact_info": "ivanov@mail.ru", "address": "г. Санкт-Петербург, пр. Невский, 20"},
    {"name": "ООО 'КанцТовары'", "contact_info": "office@kantc.ru", "address": "г. Казань, ул. Баумана, 5"}
]

def init_db(db: Session) -> None:
    """
    Инициализация базы данных начальными данными
    """
    # Создание администратора, если его нет
    create_first_admin(db)
    
    # Создание начальных категорий
    create_initial_categories(db)
    
    # Создание начальных поставщиков
    create_initial_suppliers(db)

def create_first_admin(db: Session) -> None:
    """
    Создание первого администратора системы
    """
    # Проверяем существование администратора
    try:
        admin = db.query(User).filter_by(email="admin@example.com").first()
        if not admin:
            try:
                admin_obj = User(
                    email="admin@example.com",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Администратор системы",
                    role="admin",
                    is_active=True
                )
                db.add(admin_obj)
                db.commit()
                logger.info("Создан первый администратор")
            except IntegrityError:
                db.rollback()
                logger.warning("Администратор уже существует")
        else:
            logger.info("Администратор уже существует")
    except Exception as e:
        logger.error(f"Ошибка при проверке или создании администратора: {str(e)}")

def create_initial_categories(db: Session) -> None:
    """
    Создание начальных категорий товаров
    """
    for category_data in INITIAL_CATEGORIES:
        try:
            category = db.query(Category).filter_by(name=category_data["name"]).first()
            if not category:
                try:
                    category_obj = Category(**category_data)
                    db.add(category_obj)
                    db.commit()
                    logger.info(f"Создана категория: {category_data['name']}")
                except IntegrityError:
                    db.rollback()
                    logger.warning(f"Категория {category_data['name']} уже существует")
        except Exception as e:
            logger.error(f"Ошибка при проверке или создании категории {category_data['name']}: {str(e)}")

def create_initial_suppliers(db: Session) -> None:
    """
    Создание начальных поставщиков
    """
    for supplier_data in INITIAL_SUPPLIERS:
        try:
            supplier = db.query(Supplier).filter_by(name=supplier_data["name"]).first()
            if not supplier:
                try:
                    supplier_obj = Supplier(**supplier_data)
                    db.add(supplier_obj)
                    db.commit()
                    logger.info(f"Создан поставщик: {supplier_data['name']}")
                except IntegrityError:
                    db.rollback()
                    logger.warning(f"Поставщик {supplier_data['name']} уже существует")
        except Exception as e:
            logger.error(f"Ошибка при проверке или создании поставщика {supplier_data['name']}: {str(e)}") 