from datetime import datetime
from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.exc import SQLAlchemyError

from app.core.extensions import db

class BaseModel(db.Model):
    """Базовая модель данных с общими полями"""
    __abstract__ = True

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def save(self, session=None):
        """Сохранение объекта в базу данных с обработкой транзакции"""
        session = session or db.session
        try:
            session.add(self)
            session.commit()
            return self
        except SQLAlchemyError as e:
            session.rollback()
            raise e

    def delete(self, session=None):
        """Удаление объекта из базы данных с обработкой транзакции"""
        session = session or db.session
        try:
            session.delete(self)
            session.commit()
            return self
        except SQLAlchemyError as e:
            session.rollback()
            raise e

    @classmethod
    def get_by_id(cls, session, id):
        """Получение объекта по ID"""
        return session.query(cls).filter_by(id=id).first()

    @classmethod
    def get_all(cls, session):
        """Получение всех объектов"""
        return session.query(cls).all()

    @classmethod
    def get_filtered(cls, session, **kwargs):
        """Получение объектов с фильтрацией по полям"""
        return session.query(cls).filter_by(**kwargs).all() 