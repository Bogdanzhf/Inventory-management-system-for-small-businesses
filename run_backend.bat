@echo off
echo Установка проекта в режиме разработки...
pip install -e .
echo Запуск бэкенда...
cd backend
set PYTHONPATH=..
python -m app.main 