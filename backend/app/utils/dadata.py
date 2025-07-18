import os
import logging
from typing import Dict, Any, List
from dadata import Dadata

logger = logging.getLogger(__name__)


def get_address_suggestions(query: str, count: int = 10) -> List[Dict[str, Any]]:
    """
    Получение подсказок по адресу с использованием Dadata API.
    
    Args:
        query: Строка запроса (часть адреса).
        count: Количество подсказок для возврата.
        
    Returns:
        Список подсказок с адресами.
    """
    try:
        # Получение API ключей из переменных окружения
        token = os.environ.get('DADATA_API_KEY')
        secret = os.environ.get('DADATA_SECRET_KEY')
        
        if not token or not secret:
            logger.warning("Dadata API ключи не настроены")
            return []
        
        # Инициализация клиента Dadata
        dadata = Dadata(token, secret)
        
        # Получение подсказок
        result = dadata.suggest("address", query, count=count)
        
        # Форматирование результатов
        suggestions = []
        for item in result:
            suggestions.append({
                "value": item["value"],
                "unrestricted_value": item["unrestricted_value"],
                "data": item["data"]
            })
        
        return suggestions
        
    except Exception as e:
        logger.error(f"Ошибка при получении подсказок адреса: {str(e)}")
        return []
        

def get_company_suggestions(query: str, count: int = 10) -> List[Dict[str, Any]]:
    """
    Получение подсказок по организациям с использованием Dadata API.
    
    Args:
        query: Строка запроса (часть названия или ИНН организации).
        count: Количество подсказок для возврата.
        
    Returns:
        Список подсказок с организациями.
    """
    try:
        # Получение API ключей из переменных окружения
        token = os.environ.get('DADATA_API_KEY')
        secret = os.environ.get('DADATA_SECRET_KEY')
        
        if not token or not secret:
            logger.warning("Dadata API ключи не настроены")
            return []
        
        # Инициализация клиента Dadata
        dadata = Dadata(token, secret)
        
        # Получение подсказок
        result = dadata.suggest("party", query, count=count)
        
        # Форматирование результатов
        suggestions = []
        for item in result:
            data = item["data"]
            suggestions.append({
                "name": item["value"],
                "inn": data.get("inn"),
                "kpp": data.get("kpp"),
                "address": data.get("address", {}).get("value", ""),
                "management_name": data.get("management", {}).get("name", ""),
                "type": data.get("type") 
            })
        
        return suggestions
        
    except Exception as e:
        logger.error(f"Ошибка при получении подсказок организаций: {str(e)}")
        return [] 