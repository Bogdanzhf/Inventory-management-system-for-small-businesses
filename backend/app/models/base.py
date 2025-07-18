from datetime import datetime
from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.exc import SQLAlchemyError
from app.db.session import db


class BaseModel(db.Model):
    """Базовая модель данных с общими полями"""
    __abstract__ = True

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def save(self):
        """Сохранение объекта в базу данных с обработкой транзакции"""
        try:
            db.session.add(self)
            db.session.commit()
            return self
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    def delete(self):
        """Удаление объекта из базы данных с обработкой транзакции"""
        try:
            db.session.delete(self)
            db.session.commit()
            return self
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    @classmethod
    def get_by_id(cls, id):
        """Получение объекта по ID"""
        return cls.query.filter_by(id=id).first()

    @classmethod
    def get_all(cls):
        """Получение всех объектов"""
        return cls.query.all()

    @classmethod
    def get_filtered(cls, **kwargs):
        """Получение объектов с фильтрацией по полям"""
        return cls.query.filter_by(**kwargs).all() 