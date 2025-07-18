"""
Модуль машинного обучения для прогнозирования запасов
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
import joblib
import os
import logging
from typing import List, Dict, Any, Tuple, Optional

from ..models.inventory import Product
from ..models.order import Order
from ..db.session import db_session

# Настройка логирования
logger = logging.getLogger(__name__)

MODEL_PATH = "app/services/models/"
os.makedirs(MODEL_PATH, exist_ok=True)

class InventoryForecaster:
    """Модель МО для прогнозирования потребностей в запасах на основе исторических данных"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.model_path = os.path.join(MODEL_PATH, "inventory_forecast_model.joblib")
        self.scaler_path = os.path.join(MODEL_PATH, "inventory_scaler.joblib")
        self._load_or_create_model()
    
    def _load_or_create_model(self):
        """Загрузка существующей модели или создание новой, если не существует"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                logger.info("Модель МО успешно загружена")
            else:
                # Инициализация новой модели
                self.model = RandomForestRegressor(n_estimators=100, random_state=42)
                self.scaler = StandardScaler()
                logger.info("Инициализирована новая модель МО")
        except Exception as e:
            logger.error(f"Ошибка загрузки модели МО: {str(e)}")
            # Инициализация новой модели при ошибке
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
            self.scaler = StandardScaler()
    
    def _prepare_features(self, product_id: int, days: int = 90) -> Optional[pd.DataFrame]:
        """Подготовка признаков из исторических данных"""
        # Получение даты отсечения
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Получение исторических уровней запасов
        with db_session() as session:
            # Получение истории запасов через детали заказов
            order_details = session.query(Order).filter(
                Order.created_at > cutoff_date
            ).all()
            
            # Извлечение соответствующих данных для конкретного продукта
            data = []
            for order in order_details:
                for item in order.items:
                    if item.product_id == product_id:
                        data.append({
                            'date': order.created_at,
                            'quantity': item.quantity,
                            'order_type': order.order_type,
                            'day_of_week': order.created_at.weekday(),
                            'day_of_month': order.created_at.day,
                            'month': order.created_at.month
                        })
        
        if not data:
            logger.warning(f"Исторические данные для продукта {product_id} не найдены")
            return None
        
        df = pd.DataFrame(data)
        
        # Добавление временных признаков
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        # Создание признаков с временным лагом
        for lag in [1, 7, 14, 30]:
            df[f'lag_{lag}'] = df['quantity'].shift(lag)
        
        # Удаление строк с отсутствующими значениями
        df = df.dropna()
        
        if df.empty:
            logger.warning("После подготовки признаков DataFrame пуст")
            return None
        
        return df

    def train(self, product_id: Optional[int] = None) -> bool:
        """Обучение модели прогнозирования для конкретного продукта или всех продуктов"""
        try:
            with db_session() as session:
                if product_id:
                    products = [session.query(Product).filter_by(id=product_id).first()]
                    if not products[0]:
                        logger.warning(f"Продукт с ID {product_id} не найден")
                        return False
                else:
                    products = session.query(Product).all()
            
            all_features = []
            all_targets = []
            
            for product in products:
                df = self._prepare_features(product.id)
                if df is None or len(df) < 10:  # Необходимо минимальное количество данных для обучения
                    continue
                
                features = df[['day_sin', 'day_cos', 'month_sin', 'month_cos', 
                               'lag_1', 'lag_7', 'lag_14', 'lag_30']].values
                target = df['quantity'].values
                
                all_features.append(features)
                all_targets.append(target)
            
            if not all_features:
                logger.warning("Недостаточно данных для обучения")
                return False
            
            X = np.vstack(all_features)
            y = np.concatenate(all_targets)
            
            # Проверяем, что self.scaler не равен None
            if self.scaler is None:
                self.scaler = StandardScaler()
                
            # Масштабирование признаков
            X_scaled = self.scaler.fit_transform(X)
            
            # Проверяем, что self.model не равен None
            if self.model is None:
                self.model = RandomForestRegressor(n_estimators=100, random_state=42)
                
            # Обучение модели
            self.model.fit(X_scaled, y)
            
            # Сохранение модели и скейлера
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            
            logger.info("Модель успешно обучена и сохранена")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка обучения модели: {str(e)}")
            return False
    
    def predict_future_demand(self, product_id: int, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """Прогнозирование будущего спроса на запасы для конкретного продукта"""
        try:
            df = self._prepare_features(product_id)
            if df is None or df.empty:
                logger.warning(f"Нет доступных данных для прогнозирования продукта {product_id}")
                return []
            
            # Получение последних значений для признаков с лагом
            last_row = df.iloc[-1]
            
            predictions = []
            current_date = datetime.now()
            
            # Проверяем наличие self.model и self.scaler
            if self.model is None or self.scaler is None:
                logger.error("Модель или скейлер не инициализированы")
                return []
            
            # Прогнозирование на каждый день вперед
            for i in range(1, days_ahead + 1):
                future_date = current_date + timedelta(days=i)
                
                # Создание вектора признаков для прогнозирования
                features = np.array([
                    np.sin(2 * np.pi * future_date.weekday() / 7),  # day_sin
                    np.cos(2 * np.pi * future_date.weekday() / 7),  # day_cos
                    np.sin(2 * np.pi * future_date.month / 12),     # month_sin
                    np.cos(2 * np.pi * future_date.month / 12),     # month_cos
                    last_row['quantity'] if i == 1 else predictions[-1]['predicted_quantity'],  # lag_1
                    df['quantity'].iloc[-7] if i <= 7 else predictions[i-8]['predicted_quantity'],  # lag_7
                    df['quantity'].iloc[-14] if i <= 14 else predictions[i-15]['predicted_quantity'],  # lag_14
                    df['quantity'].iloc[-30] if i <= 30 else predictions[i-31]['predicted_quantity'],  # lag_30
                ]).reshape(1, -1)
                
                # Масштабирование признаков
                scaled_features = self.scaler.transform(features)
                
                # Прогнозирование
                predicted_quantity = max(0, round(self.model.predict(scaled_features)[0]))
                
                predictions.append({
                    'date': future_date.strftime('%Y-%m-%d'),
                    'predicted_quantity': predicted_quantity
                })
            
            return predictions
            
        except Exception as e:
            logger.error(f"Ошибка прогнозирования будущего спроса: {str(e)}")
            return []
    
    def get_restock_recommendations(self) -> List[Dict[str, Any]]:
        """Получение рекомендаций по пополнению запасов на основе прогнозов"""
        recommendations = []
        
        try:
            with db_session() as session:
                products = session.query(Product).all()
                
                for product in products:
                    # Пропуск, если минимальный порог не установлен
                    if product.min_stock is None:
                        continue
                    
                    # Прогнозирование на следующие 14 дней
                    predictions = self.predict_future_demand(product.id, days_ahead=14)
                    if not predictions:
                        continue
                    
                    # Расчет среднего прогнозируемого спроса
                    total_predicted = sum(p['predicted_quantity'] for p in predictions)
                    avg_daily_demand = total_predicted / len(predictions)
                    
                    # Дни до достижения минимального порога
                    if avg_daily_demand > 0:
                        days_until_min = (product.quantity - product.min_stock) / avg_daily_demand
                    else:
                        days_until_min = float('inf')
                    
                    # Если запас достигнет минимального порога в течение 14 дней
                    if 0 <= days_until_min <= 14:
                        # Расчет рекомендуемого количества заказа (для 30 дней запаса)
                        recommended_qty = max(0, round(avg_daily_demand * 30) - product.quantity)
                        
                        recommendations.append({
                            'product_id': product.id,
                            'product_name': product.name,
                            'current_quantity': product.quantity,
                            'min_threshold': product.min_stock,
                            'days_until_threshold': round(days_until_min, 1),
                            'recommended_order_quantity': recommended_qty
                        })
            
            # Сортировка по срочности (дни до порога)
            recommendations.sort(key=lambda x: x['days_until_threshold'])
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Ошибка получения рекомендаций по пополнению запасов: {str(e)}")
            return []


# Экземпляр-одиночка
forecaster = InventoryForecaster()

def get_forecaster() -> InventoryForecaster:
    """Получение экземпляра прогнозирующей модели"""
    return forecaster 