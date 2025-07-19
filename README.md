# Inventory Management System

Comprehensive inventory management solution with React frontend, Flask backend, and PostgreSQL database.

## Features

- User authentication and authorization with JWT
- Inventory tracking and management
- Order processing
- Supplier management
- Analytics and forecasting
- Multi-language support (i18n)
- Dark mode
- Responsive design

## Tech Stack

### Frontend
- React with TypeScript
- MUI (Material UI) components
- Ant Design components
- MobX for state management
- Vite for building and development
- SCSS modules for styling
- i18next for internationalization

### Backend
- Flask (Python)
- PostgreSQL database
- SQLAlchemy ORM
- Flask-JWT-Extended for authentication
- Celery for background tasks
- Marshmallow for serialization

### Infrastructure
- Docker for containerization
- Nginx for web server and reverse proxy

## Prerequisites

- Node.js 16+ and npm
- Python 3.9+
- PostgreSQL 12+
- Docker and Docker Compose (optional)

## Installation and Setup

### Quick Start

1. Clone the repository
2. Run the setup script:

```
.\run.bat
```

### Manual Setup

#### Database Setup

1. Ensure PostgreSQL is running
2. Set up the database:

```
python setup_db.py
```

#### Backend Setup

1. Navigate to the backend directory:

```
cd backend
```

2. Create and activate a virtual environment:

```
python -m venv venv
venv\Scripts\activate
```

3. Install dependencies:

```
pip install -r requirements.txt
```

4. Run the backend server:

```
python -m app.main
```

The backend API will be available at http://localhost:5000/api/

#### Frontend Setup

1. Navigate to the frontend directory:

```
cd frontend
```

2. Install dependencies:

```
npm install
```

3. Start the development server:

```
npm run dev
```

The frontend will be available at http://localhost:3000/

## Docker Setup

To run the entire application using Docker:

```
docker-compose -f docker-compose.dev.yml up
```

## API Documentation

The API documentation is available at http://localhost:5000/api/docs when the backend is running.

## Default Users

The system is initialized with a default admin user:

- Email: admin@example.com
- Password: admin123

## Project Structure

```
inventory-management-system/
├── backend/               # Flask backend
│   ├── app/               # Main application package
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core functionality
│   │   ├── db/            # Database configuration
│   │   ├── models/        # Database models
│   │   └── services/      # Business logic services
├── frontend/              # React frontend
│   ├── public/            # Static assets
│   └── src/               # Source code
│       ├── components/    # Reusable components
│       ├── hooks/         # Custom React hooks
│       ├── pages/         # Page components
│       ├── services/      # API services
│       ├── store/         # MobX stores
│       ├── styles/        # Global styles
│       └── utils/         # Utility functions
├── nginx/                 # Nginx configuration
└── docker-compose.yml     # Docker Compose configuration
```

## Troubleshooting

If you encounter any issues:

1. Ensure database is properly set up
2. Check logs for errors
3. Verify environment variables are correctly set

## License

This project is licensed under the MIT License - see the LICENSE file for details. 