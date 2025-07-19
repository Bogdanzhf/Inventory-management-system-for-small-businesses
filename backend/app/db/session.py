from contextlib import contextmanager
import logging
from app.core.extensions import db

logger = logging.getLogger(__name__)

def init_db(app):
    """
    Эта функция оставлена для обратной совместимости.
    Фактическая инициализация происходит в core/extensions.py
    """
    pass

def get_db():
    """Получение объекта базы данных"""
    return db

def check_db_connection():
    """
    Проверка соединения с базой данных
    Returns:
        bool: True если соединение работает, False если есть проблема
    """
    try:
        # Пробуем выполнить простой запрос
        db.session.execute("SELECT 1")
        logger.info("Соединение с базой данных работает")
        return True
    except Exception as e:
        logger.error(f"Ошибка соединения с базой данных: {str(e)}")
        return False

@contextmanager
def db_session():
    """Контекстный менеджер для сессии базы данных"""
    session = db.session
    try:
        logger.debug("Начало сессии базы данных")
        yield session
        session.commit()
        logger.debug("Сессия базы данных успешно завершена")
    except Exception as e:
        logger.error(f"Ошибка в сессии базы данных: {str(e)}")
        session.rollback()
        logger.debug("Сессия базы данных откатана")
        raise e 