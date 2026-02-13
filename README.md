# MedReminder

A full-featured medication management platform inspired by MediSafe. Helps users track medications, receive intelligent reminders, monitor health measurements, share schedules with caregivers, and detect drug interactions.

## Features

### Core Features
- **Medication Management**: Add, track, and manage medications with detailed information
- **Smart Scheduling**: Support for daily, specific days, interval, and cycle schedules
- **Dose Logging**: Track taken, skipped, missed, and snoozed doses
- **Refill Reminders**: Automatic alerts when medication is running low
- **Health Measurements**: Track blood pressure, glucose, weight, and more
- **Drug Interactions**: Check for potential interactions between medications
- **MedFriends**: Share schedules with caregivers and get notified on missed doses
- **Appointments**: Doctor appointment reminders and calendar

### Premium Features
- Unlimited medications (Free: 10)
- Unlimited health metrics (Free: 3)
- Unlimited MedFriends (Free: 1)
- AI-powered adherence predictions
- Just-In-Time Interventions (JITI)
- Drug information chatbot
- Export reports
- Pharmacy delivery integration

## Tech Stack

### Backend
- **Node.js + Express + TypeScript**: API server
- **PostgreSQL**: Primary database
- **Prisma**: ORM and database migrations
- **Redis + BullMQ**: Job queue for reminders
- **MinIO**: S3-compatible file storage
- **JWT**: Authentication
- **Firebase Cloud Messaging**: Push notifications

### AI Service
- **Python + FastAPI**: AI microservice
- **Scikit-learn**: Machine learning models

### Frontend
- **React + TypeScript + Vite**: Web dashboard
- **TanStack Query**: Data fetching
- **Zustand**: State management
- **Tailwind CSS**: Styling
- **Recharts**: Charts and visualizations

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.12 (for AI service development)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd MedReminder

# Create environment file
cp .env.example .env

# Start infrastructure services
docker-compose up -d postgres redis minio
```

### 2. Setup Backend

```bash
# Navigate to API service
cd services/api

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:4000`

### 3. Setup Web Frontend

```bash
# Navigate to web app
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

The web app will be available at `http://localhost:3000`

### 4. Setup AI Service (Optional)

```bash
# Navigate to AI service
cd services/ai-engine

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --port 8000
```

The AI service will be available at `http://localhost:8000`

## Demo Credentials

After seeding the database:
- Email: `demo@medreminder.com`
- Password: `demo123`

## Development

### Running with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Reset everything (including data)
docker-compose down -v
```

### API Documentation

Once the backend is running, you can access:
- API Base URL: `http://localhost:4000/api/v1`
- Health Check: `http://localhost:4000/health`

### Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Register new user |
| `POST /auth/login` | Login user |
| `GET /auth/me` | Get current user |
| `GET /medications` | List medications |
| `POST /medications` | Create medication |
| `GET /dose-logs` | List dose logs |
| `POST /dose-logs` | Log a dose |
| `GET /health-measurements` | List measurements |
| `GET /interactions/check` | Check drug interactions |
| `GET /users/dashboard` | Get dashboard stats |

## Project Structure

```
MedReminder/
├── apps/
│   ├── mobile/              # React Native mobile app (to be implemented)
│   └── web/                 # React web dashboard
├── packages/
│   ├── shared-types/        # Shared TypeScript types
│   ├── ui-kit/              # Shared UI components
│   └── utils/               # Common utilities
├── services/
│   ├── api/                 # Node.js/Express backend
│   │   ├── src/
│   │   │   ├── modules/     # Feature modules
│   │   │   ├── common/      # Shared code
│   │   │   └── config/      # Configuration
│   │   └── prisma/          # Database schema
│   └── ai-engine/           # Python FastAPI AI service
├── infra/
│   ├── docker/              # Dockerfiles
│   └── nginx/               # Nginx configuration
├── docker-compose.yml       # Docker Compose configuration
└── plan/                    # Implementation plans
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://medreminder:medreminder123@localhost:5432/medreminder
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## Database Schema

The application uses PostgreSQL with the following main entities:

- **users**: User accounts and profiles
- **medications**: Medication details and inventory
- **schedules**: Dosing schedules
- **dose_logs**: Historical dose records
- **health_measurements**: Health metric readings
- **drug_interactions**: Known drug interactions
- **medfriend_links**: Caregiver relationships
- **appointments**: Doctor appointments
- **subscriptions**: Premium subscription data

## Testing

```bash
# Run backend tests
cd services/api
npm test

# Run web tests
cd apps/web
npm test
```

## Production Deployment

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Setup

1. Set strong JWT secrets
2. Configure Firebase for push notifications
3. Set up SSL certificates
4. Configure backup for PostgreSQL
5. Set up monitoring (Prometheus/Grafana)

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m "feat: add my feature"`
3. Push to branch: `git push origin feature/my-feature`
4. Create a Pull Request

### Commit Convention

We use Conventional Commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

## License

MIT License - see LICENSE file for details

## Support

For support, email support@medreminder.com or create an issue in the repository.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Apple Health / Google Fit integration
- [ ] Smart watch support
- [ ] Pharmacy partner APIs
- [ ] Voice reminders
- [ ] Family account management
- [ ] Provider dashboard
- [ ] Medication barcode scanning
