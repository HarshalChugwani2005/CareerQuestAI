# RAVi by CareerQuest AI

A comprehensive loan management and student employability prediction system powered by machine learning.

## Tech Stack

- **Backend:** FastAPI (Python 3.11+)
- **Frontend:** React + Vite
- **Database:** PostgreSQL (async with SQLAlchemy) / SQLite (Fallback)
- **Cache:** Redis
- **Messaging:** Apache Kafka (Mocked fallback available)
- **ML:** XGBoost, scikit-learn, PyTorch
- **Chrome Extension:** Browser integration

## Implementation Guide

### 1. Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Docker Desktop** (for PostgreSQL/Redis/Kafka)

### 2. Backend Setup

```bash
# 1. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure Environment
# Copy .env.example to .env and update DATABASE_URL
# Note: If PostgreSQL is not available, the app falls back to local SQLite (ravi.db)

# 4. Start the API
$env:PYTHONPATH="."
python -m uvicorn app.main:app --port 8000 --reload
```

### 3. Frontend Setup

```bash
# 1. Install Node dependencies
npm install

# 2. Start the development server
npm run dev
```

### 4. Database Initialization

The application automatically creates tables on startup. To seed the database with demo data, run:

```bash
$env:PYTHONPATH="."
python scripts/seed_demo_data.py
```

## Testing & Demo Credentials

Use the following pre-configured account to test the **Lender Enterprise Portal** (Admin Dashboard):

- **Email:** `harshal@gmail.com`
- **Password:** `12345678`
- **Role:** Lender / Admin

## Development Notes

- **Kafka Mocking**: If you do not have a Kafka broker running locally, the application will automatically fall back to a **Mock Kafka Producer/Consumer** to prevent crashes.
- **Bcrypt Fix**: Password hashing is implemented using raw `bcrypt` to avoid the 72-byte truncation issues common with `passlib` on some Python versions.
- **JWT Middleware**: The custom `JWTAuthMiddleware` handles authentication and CORS preflight. Exempt paths include `/auth/`, `/health`, and documentation endpoints.

## API Endpoints

- `GET /health` - Health check
- `POST /auth/login` - Authentication
- `POST /auth/register` - User registration
- `GET /auth/me` - Current user profile
- `GET /v1/scores/{student_id}` - Predictive score retrieval

## License

Proprietary - CareerQuest AI
