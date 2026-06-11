# Axion - Project Management Tool API

This repository contains the backend API for Axion, a project management tool. It's built with Python, Django, and Django REST Framework, providing a robust and scalable foundation for managing users, sites, and more.

## Features

*   **Complete User Authentication**: Registration with email OTP verification, login, and secure password management (change and recovery).
*   **JWT-Based Sessions**: Stateless and secure authentication using JSON Web Tokens.
*   **Site Management**: Full CRUD (Create, Read, Update, Delete) functionality for project sites.
*   **Role-Based Access**: Automatic admin role assignment to the user who creates a site.
*   **Service-Oriented Architecture**: Business logic is cleanly decoupled into a dedicated service layer (`SiteService`, `MailService`, `AuthService`).
*   **Automatic API Documentation**: Auto-generated OpenAPI schema and interactive Swagger UI via `drf-spectacular`.
*   **Custom Pagination**: A reusable, custom pagination component for all list endpoints.
*   **Comprehensive Test Suite**: A solid foundation of unit and integration tests to ensure code quality and reliability.

## Tech Stack

*   **Backend**: Python, Django, Django REST Framework
*   **Database**: PostgreSQL
*   **Authentication**: `djangorestframework-simplejwt`
*   **API Documentation**: `drf-spectacular`
*   **Environment Configuration**: `python-dotenv`
*   **Email**: Django's built-in SMTP support

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

*   Python 3.10+
*   PostgreSQL 12+
*   A package manager like `pip`.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd project-managements
    ```

2.  **Install dependencies:**
    *(It's recommended to use a virtual environment)*
    ```sh
    pip install -r requirements.txt
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the project root and add the necessary configuration. Use the following template:

    ```env
    # Django
    DJANGO_SECRET_KEY="your-strong-secret-key"

    # Database
    DATABASE_NAME="axion_db"
    DATABASE_USER="axion_user"
    DATABASE_PASSWORD="your-db-password"
    DATABASE_HOST="localhost"
    DATABASE_PORT="5432"

    # JWT
    JWT_SECRET_KEY="your-jwt-secret-key"
    ACCESS_TOKEN_LIFETIME="1" # In days
    REFRESH_TOKEN_LIFETIME="7" # In days

    # Email (Example for Gmail SMTP)
    EMAIL_HOST="smtp.gmail.com"
    EMAIL_PORT="587"
    EMAIL_USE_TLS="True"
    EMAIL_HOST_USER="your-email@gmail.com"
    EMAIL_HOST_PASSWORD="your-app-password"
    DEFAULT_FROM_EMAIL="your-email@gmail.com"

    # Application URLs
    FRONTEND_URL="http://localhost:3000"
    APP_LOGO="https://your-app-logo-url.com/logo.png"
    ```

4.  **Run database migrations:**
    ```sh
    python manage.py migrate
    ```

5.  **Run the development server:**
    ```sh
    python manage.py runserver
    ```
    The API will be available at `http://127.0.0.1:8000/`.

## API Documentation

Once the server is running, you can access the interactive Swagger UI to explore and test the API endpoints.

*   **Swagger UI**: `http://127.0.0.1:8000/api/docs/`
*   **OpenAPI Schema**: `http://127.0.0.1:8000/api/schema/`

## Running Tests

To run the full test suite and ensure everything is working as expected:
```sh
python manage.py test
```
