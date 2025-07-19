@echo off
echo Запуск приложения в режиме разработки...

:: Проверяем наличие .env.dev файла
if not exist .env.dev (
    echo Файл .env.dev не найден. Копирую из .env.example...
    if exist .env.example (
        copy .env.example .env.dev
    ) else (
        echo ВНИМАНИЕ: .env.example файл не найден. Создайте .env.dev файл вручную.
        pause
        exit /b 1
    )
)

:: Создаем базу данных и запускаем миграции
echo Инициализация базы данных...
python init_db.py

:: Запускаем фронтенд в фоновом режиме
echo Запуск фронтенда на порту 3000...
cd frontend && start /B cmd /c "npm run dev"

:: Запускаем бэкенд
echo Запуск бэкенда на порту 5000...
cd backend && python -m app.main

pause 