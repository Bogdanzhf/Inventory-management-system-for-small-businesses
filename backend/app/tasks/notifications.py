import os
import logging
from typing import List, Dict, Any
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.core.celery import celery
from app.models import Product, User, UserRole
from app.db.session import db

logger = logging.getLogger(__name__)


@celery.task
def send_email(to_emails: List[str], subject: str, html_content: str) -> Dict[str, Any]:
    """Отправка email через SendGrid API"""
    try:
        # Получение API ключа из переменных окружения
        api_key = os.environ.get('SENDGRID_API_KEY')
        from_email = os.environ.get('EMAIL_FROM')
        
        if not api_key:
            logger.error("SENDGRID_API_KEY не настроен")
            return {"success": False, "error": "SENDGRID_API_KEY не настроен"}
        
        if not from_email:
            logger.error("EMAIL_FROM не настроен")
            return {"success": False, "error": "EMAIL_FROM не настроен"}
        
        # Создание объекта сообщения
        message = Mail(
            from_email=from_email,
            to_emails=to_emails,
            subject=subject,
            html_content=html_content
        )
        
        # Отправка сообщения
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Email успешно отправлен"
        }
        
    except Exception as e:
        logger.error(f"Ошибка отправки email: {str(e)}")
        return {"success": False, "error": str(e)}


@celery.task
def check_low_stock() -> Dict[str, Any]:
    """Проверка товаров с низким запасом и отправка уведомлений"""
    try:
        # Получение товаров с низким запасом
        products = Product.query.filter(Product.quantity <= Product.min_stock).all()
        
        if not products:
            return {"success": True, "message": "Нет товаров с низким запасом"}
        
        # Получение списка администраторов и владельцев
        admins = User.query.filter(User.role.in_([UserRole.ADMIN, UserRole.OWNER]), User.is_active == True).all()
        
        if not admins:
            return {"success": False, "error": "Нет активных администраторов для отправки уведомлений"}
        
        admin_emails = [admin.email for admin in admins]
        
        # Формирование HTML-контента письма
        product_rows = ""
        for product in products:
            product_rows += f"""
            <tr>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.quantity}</td>
                <td>{product.min_stock}</td>
            </tr>
            """
        
        html_content = f"""
        <html>
        <head>
            <style>
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f2f2f2; }}
                tr:hover {{ background-color: #f5f5f5; }}
                .warning {{ color: red; }}
            </style>
        </head>
        <body>
            <h2>Уведомление о низком уровне запасов</h2>
            <p>Следующие товары имеют низкий уровень запасов и требуют пополнения:</p>
            
            <table>
                <tr>
                    <th>Наименование</th>
                    <th>SKU</th>
                    <th>Текущее количество</th>
                    <th>Минимальный запас</th>
                </tr>
                {product_rows}
            </table>
            
            <p>Пожалуйста, примите необходимые меры для пополнения запасов.</p>
        </body>
        </html>
        """
        
        # Отправка уведомления
        send_email.delay(
            to_emails=admin_emails,
            subject="Уведомление о низком уровне запасов",
            html_content=html_content
        )
        
        return {
            "success": True, 
            "message": f"Уведомление отправлено администраторам о {len(products)} товарах с низким запасом"
        }
        
    except Exception as e:
        logger.error(f"Ошибка проверки товаров с низким запасом: {str(e)}")
        return {"success": False, "error": str(e)} 