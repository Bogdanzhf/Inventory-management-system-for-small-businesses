import os
import qrcode
import base64
from io import BytesIO
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


def generate_qrcode(data: str, size: int = 10, box_size: int = 10, border: int = 4) -> Tuple[Optional[str], Optional[str]]:
    """
    Генерация QR-кода из строки данных.
    
    Args:
        data: Данные для кодирования в QR.
        size: Размер изображения QR-кода.
        box_size: Размер каждого бокса QR-кода.
        border: Толщина границы вокруг QR-кода.
        
    Returns:
        Tuple с base64 представлением QR-кода и путь к сохраненному файлу или (None, None) в случае ошибки.
    """
    try:
        # Создание объекта QR-кода
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.ERROR_CORRECT_L,  # Используем константы непосредственно из qrcode
            box_size=box_size,
            border=border,
        )
        
        # Добавление данных
        qr.add_data(data)
        qr.make(fit=True)
        
        # Создание изображения
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Конвертация изображения в base64
        buffered = BytesIO()
        img.save(buffered)  # Формат PNG используется по умолчанию
        buffered.seek(0)  # Возвращаемся к началу буфера
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Возвращаем base64 строку для встраивания в HTML
        base64_image = f"data:image/png;base64,{img_str}"
        
        return base64_image, None
        
    except Exception as e:
        logger.error(f"Ошибка при генерации QR-кода: {str(e)}")
        return None, None


def generate_and_save_qrcode(data: str, product_id: int, directory: str = "qrcodes") -> Tuple[Optional[str], Optional[str]]:
    """
    Генерация и сохранение QR-кода на диск.
    
    Args:
        data: Данные для кодирования в QR.
        product_id: ID товара для формирования имени файла.
        directory: Директория для сохранения файлов QR-кодов.
        
    Returns:
        Tuple с base64 представлением QR-кода и путь к сохраненному файлу или (None, None) в случае ошибки.
    """
    try:
        # Создание директории, если ее нет
        if not os.path.exists(directory):
            os.makedirs(directory)
        
        # Генерация QR-кода
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.ERROR_CORRECT_L,  # Используем константы непосредственно из qrcode
            box_size=10,
            border=4,
        )
        
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Формирование имени файла
        filename = os.path.join(directory, f"product_{product_id}.png")
        
        # Сохранение изображения на диск с помощью PIL
        with open(filename, 'wb') as f:
            img.save(f)
        
        # Конвертация изображения в base64
        buffered = BytesIO()
        img.save(buffered)  # Формат PNG используется по умолчанию
        buffered.seek(0)  # Возвращаемся к началу буфера
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Возвращаем base64 строку для встраивания в HTML и путь к файлу
        base64_image = f"data:image/png;base64,{img_str}"
        
        return base64_image, filename
        
    except Exception as e:
        logger.error(f"Ошибка при генерации и сохранении QR-кода: {str(e)}")
        return None, None 