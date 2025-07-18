from celery import Celery
from flask import Flask


def init_celery(app: Flask) -> Celery:
    """Инициализация Celery для фоновых задач"""
    celery_instance = Celery(
        app.import_name,
        broker=app.config.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
        backend=app.config.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    )
    
    celery_instance.conf.update(app.config)
    
    class ContextTask(celery_instance.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery_instance.Task = ContextTask
    return celery_instance


# Экземпляр Celery по умолчанию для использования в задачах
# В реальном приложении будет перенастроен в init_celery при инициализации приложения
celery = Celery(
    'app',
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
) 