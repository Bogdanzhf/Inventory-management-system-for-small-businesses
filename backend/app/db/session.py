from contextlib import contextmanager
from app.core.extensions import db

def init_db(app):
    """
    Эта функция оставлена для обратной совместимости.
    Фактическая инициализация происходит в core/extensions.py
    """
    pass

def get_db():
    """Получение объекта базы данных"""
    return db

@contextmanager
def db_session():
    """Контекстный менеджер для сессии базы данных"""
    session = db.session
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e 