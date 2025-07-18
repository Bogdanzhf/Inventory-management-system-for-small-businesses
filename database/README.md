# База данных

Эта директория содержит файлы, связанные с базой данных проекта.

## Структура

- `migrations/` - директория с миграциями базы данных
- `scripts/` - скрипты для работы с базой данных

## Миграции

Для управления миграциями используется Alembic. Миграции находятся в директории `migrations/`.

### Создание новой миграции

```bash
cd backend
alembic revision --autogenerate -m "Описание миграции"
```

### Применение миграций

```bash
cd backend
alembic upgrade head
```

### Откат миграций

```bash
cd backend
alembic downgrade -1  # Откат на одну миграцию назад
```

## Инициализация базы данных

База данных инициализируется автоматически при запуске приложения. Начальные данные (категории, администратор и т.д.) создаются в файле `backend/app/db/init_db.py`.

## Схема базы данных

### Пользователи (users)
- id: Integer, PK
- email: String, unique
- hashed_password: String
- full_name: String
- role: String (admin, owner, employee)
- is_active: Boolean
- created_at: DateTime
- updated_at: DateTime

### Категории (categories)
- id: Integer, PK
- name: String, unique
- description: String
- created_at: DateTime
- updated_at: DateTime

### Поставщики (suppliers)
- id: Integer, PK
- name: String
- contact_info: String
- address: String
- created_at: DateTime
- updated_at: DateTime

### Инвентарь (inventory)
- id: Integer, PK
- name: String
- sku: String, unique
- description: String
- category_id: Integer, FK -> categories.id
- quantity: Integer
- unit_price: Float
- min_threshold: Integer
- location: String
- supplier_id: Integer, FK -> suppliers.id
- last_restock_date: DateTime
- created_at: DateTime
- updated_at: DateTime

### Заказы (orders)
- id: Integer, PK
- order_number: String, unique
- order_type: String (incoming, outgoing)
- status: String (pending, processing, completed, cancelled)
- supplier_customer: String
- contact_info: String
- notes: String
- created_by: Integer, FK -> users.id
- total_amount: Float
- created_at: DateTime
- updated_at: DateTime

### Элементы заказа (order_items)
- id: Integer, PK
- order_id: Integer, FK -> orders.id
- product_id: Integer, FK -> inventory.id
- quantity: Integer
- unit_price: Float
- created_at: DateTime
- updated_at: DateTime 