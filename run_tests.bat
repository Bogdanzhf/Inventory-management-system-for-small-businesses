@echo off
echo Установка проекта в режиме разработки...
pip install -e .
echo Запуск тестов бэкенда...
cd backend
set PYTHONPATH=..
python -m pytest app/tests 