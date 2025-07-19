@echo off
echo Запуск проекта Inventory Management System в режиме разработки

REM Создание базы данных и таблиц
echo Настройка базы данных...
python setup_db.py

REM Запуск бэкенд-сервера
echo Запуск бэкенд-сервера на порту 5000...
start cmd /k "cd backend && python -m app.main"

REM Даем время для запуска бэкенда
timeout /t 3 /nobreak

REM Запуск фронтенд-сервера
echo Запуск фронтенд-сервера на порту 3000...
start cmd /k "cd frontend && npm run dev"

echo.
echo Оба сервера запущены! Приложение доступно по адресу http://localhost:3000
echo Бэкенд API доступно по адресу http://localhost:5000
echo.
echo Нажмите любую клавишу для завершения всех процессов...
pause

REM Завершаем все процессы при необходимости
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul 