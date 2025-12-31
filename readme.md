# User Management System

## Project Overview & Purpose

A full-stack web application for managing user accounts with different roles and permissions. The system supports user authentication, role-based authorization, and basic user lifecycle management. This application demonstrates modern web development practices with a secure authentication system, role-based access control, and responsive UI.

## Tech Stack Used

### Backend
- Python 3.11
- Django 6.0
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Argon2 Password Hashing
- Gunicorn (Production Server)

### Frontend
- React 18
- Vite (Build Tool)
- React Router DOM
- Axios (HTTP Client)
- Tailwind CSS (Styling)

### Other Tools
- Docker (Containerization)
- PostgreSQL (Database)
- Git (Version Control)

## Setup Instructions

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd user-management-system
```

2. Navigate to the backend directory:
```bash
cd backend
```

3. Create and activate a virtual environment:
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file based on `.env.example` and configure your environment variables

6. Run database migrations:
```bash
python manage.py migrate
```

7. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

8. Start the development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` and configure your environment variables

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_HOST=your-database-host
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
```

## Deployment Instructions

The application runs within a Dockerized environment and is exposed through an Nginx reverse proxy. Cloudflare handles SSL/TLS encryption, masks the origin server’s IP address, and adds protection and performance optimizations at the edge.
### Docker Deployment

1. Build and run the containers:
```bash
docker compose up -d

```

2. For production, ensure you have proper environment variables set in a `.env` file

### Manual Deployment

1. Backend:
   - Set `DEBUG=False` in settings
   - Configure your production database
   - Run migrations: `python manage.py migrate`
   - Use a production server like Gunicorn: `gunicorn config.wsgi:application`

2. Frontend:
   - Build the application: `npm run build`
   - Serve the `dist` folder with a web server like Nginx

## API Documentation

### Authentication Endpoints

#### User Signup
- **POST** `/api/auth/signup/`
- Request Body:
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "password": "securepassword123"
}
```
- Response:
```json
{
  "refresh": "refresh_token_here",
  "access": "access_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "status": "inactive",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

#### User Login
- **POST** `/api/auth/login/`
- Request Body:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```
- Response:
```json
{
  "refresh": "refresh_token_here",
  "access": "access_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "status": "active",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

#### User Logout
- **POST** `/api/auth/logout/`
- Request Body:
```json
{
  "refresh": "refresh_token_here"
}
```
- Response:
```json
{
  "message": "Successfully logged out"
}
```

### User Management Endpoints

#### Get Current User
- **GET** `/api/auth/me/`
- Headers: `Authorization: Bearer <access_token>`
- Response:
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "user",
  "status": "active",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

#### Update Current User
- **PUT** `/api/users/me/`
- Headers: `Authorization: Bearer <access_token>`
- Request Body:
```json
{
  "full_name": "Updated Name"
}
```
- Response:
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Updated Name",
  "updated_at": "2023-01-02T00:00:00Z"
}
```

#### Change Password
- **PUT** `/api/users/me/password/`
- Headers: `Authorization: Bearer <access_token>`
- Request Body:
```json
{
  "old_password": "current_password",
  "new_password": "new_secure_password123"
}
```
- Response:
```json
{
  "message": "Password changed successfully"
}
```

### Admin Endpoints

#### List All Users (Admin Only)
- **GET** `/api/admin/users/`
- Headers: `Authorization: Bearer <access_token>`
- Query Parameters: `page`, `search`
- Response:
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "status": "active",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total_pages": 1,
  "current_page": 1,
  "total_users": 1
}
```

#### Activate User (Admin Only)
- **PATCH** `/api/admin/users/{user_id}/activate/`
- Headers: `Authorization: Bearer <access_token>`
- Response: Updated user object

#### Deactivate User (Admin Only)
- **PATCH** `/api/admin/users/{user_id}/deactivate/`
- Headers: `Authorization: Bearer <access_token>`
- Response: Updated user object
