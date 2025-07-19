@echo off
echo Инициализация базы данных...
python init_db_direct.py

echo Установка проекта в режиме разработки...
pip install -e .

echo Запуск бэкенда в фоновом режиме...
start cmd /c "cd backend && set PYTHONPATH=.. && python -m flask --app app.main run --host=0.0.0.0 --port=5000"

echo Ожидание запуска бэкенда (5 секунд)...
timeout /t 5

echo Запуск фронтенда...
cd frontend
npm run dev

echo Проект запущен! 