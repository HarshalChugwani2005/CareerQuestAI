# RAVi by CareerQuest AI

A comprehensive loan management and student employability prediction system powered by machine learning.

## Tech Stack

- **Backend:** FastAPI (Python 3.11+)
- **Frontend:** React + Vite
- **Database:** PostgreSQL (async with SQLAlchemy)
- **Cache:** Redis
- **Messaging:** Apache Kafka
- **ML:** XGBoost, scikit-learn, PyTorch
- **Chrome Extension:** Browser integration

## Project Structure

```
careerquest-ai/
├── app/
│   ├── api/routes/       # API endpoints
│   ├── core/            # Config, security, middleware
│   ├── db/              # Database session and base
│   ├── ml/              # ML training and inference
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   └── services/        # Business logic services
├── src/                 # React frontend
├── chrome-extension/   # Chrome extension files
├── alembic/             # Database migrations
└── app/ml/artifacts/   # Trained ML models
```

## Startup Steps

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker Desktop

### Option 1: Using Docker (Recommended)

```bash
# Start all services (PostgreSQL, Redis, Kafka, API)
docker-compose up --build
```

The API will be available at `http://localhost:8000`

### Option 2: Local Development

```bash
# 1. Start infrastructure services
docker-compose up -d db redis kafka zookeeper

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Run database migrations
alembic upgrade head

# 6. Start the API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 7. Start the frontend (separate terminal)
cd careerquest-ai
npm install
npm run dev
```

### Chrome Extension

```bash
# 1. Open chrome://extensions
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select chrome-extension/ folder
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/auth/login` - Authentication
- `POST /api/auth/register` - User registration
- `GET /api/students/` - Student management
- `GET /api/loans/` - Loan management
- `POST /api/ml/predict` - ML predictions
- `GET /api/irr/` - IRR calculations

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ravi
REDIS_URL=redis://localhost:6379/0
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
SECRET_KEY=your-secret-key
CORS_ALLOW_ORIGINS=http://localhost:5173
```

## License

Proprietary - CareerQuest AI
