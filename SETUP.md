# MedReminder Setup Guide

## Overview

This guide will help you set up the MedReminder application locally. MedReminder is a full-stack medication management platform with:

- **Backend**: Node.js/Express API with PostgreSQL, Redis, and MinIO
- **Frontend**: React web dashboard with TypeScript and Tailwind CSS
- **AI Service**: Python FastAPI for ML features

## Prerequisites

### Required Software
- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
  - [Download Docker](https://www.docker.com/products/docker-desktop)
- **Node.js** 18+ 
  - [Download Node.js](https://nodejs.org/)
- **Git**
  - [Download Git](https://git-scm.com/)

### Optional (for local development without Docker)
- **PostgreSQL** 16+
- **Redis** 7+
- **Python** 3.12+ (for AI service)

## Quick Start (Recommended)

### Step 1: Start Infrastructure Services

```bash
# Navigate to project root
cd MedReminder

# Start PostgreSQL, Redis, and MinIO
docker-compose up -d postgres redis minio

# Wait for services to be ready (about 30 seconds)
docker-compose ps
```

### Step 2: Setup Backend API

Open a new terminal:

```bash
# Navigate to API service
cd services/api

# Install dependencies
npm install

# Setup database (this will prompt for a migration name)
npx prisma migrate dev --name init

# Seed database with sample data
npx prisma db seed

# Start development server
npm run dev
```

The API will be available at: **http://localhost:4000**

Health check: http://localhost:4000/health

### Step 3: Setup Web Frontend

Open another terminal:

```bash
# Navigate to web app
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

The web app will be available at: **http://localhost:3000**

### Step 4: Access the Application

1. Open browser: http://localhost:3000
2. Login with demo credentials:
   - Email: `demo@medreminder.com`
   - Password: `demo123`

Or create a new account via the registration page.

## Development Access

### Database Management

**pgAdmin** (PostgreSQL GUI):
- URL: http://localhost:5050
- Email: admin@medreminder.com
- Password: admin123
- Connect to: `medreminder-postgres:5432`
  - Database: medreminder
  - Username: medreminder
  - Password: medreminder123

**Redis Commander** (Redis GUI):
- URL: http://localhost:8081

**MinIO Console** (File Storage):
- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin123

### API Endpoints

Base URL: `http://localhost:4000/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/me` | Get current user |
| GET | `/medications` | List medications |
| POST | `/medications` | Create medication |
| GET | `/users/dashboard` | Get dashboard stats |
| GET | `/health-measurements` | List health measurements |

## Troubleshooting

### Issue: Docker services won't start

**Solution:**
```bash
# Check if ports are already in use
netstat -ano | findstr :5432  # PostgreSQL
netstat -ano | findstr :6379  # Redis
netstat -ano | findstr :9000  # MinIO

# Stop conflicting services or change ports in docker-compose.yml
```

### Issue: Prisma migration fails

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually drop and recreate
docker-compose down -v
docker-compose up -d postgres
```

### Issue: "Cannot find module" errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For TypeScript path issues, regenerate Prisma client
npx prisma generate
```

### Issue: CORS errors in browser

**Solution:**
Check that the `.env` file has correct values:
```
CLIENT_URL=http://localhost:3000
API_URL=http://localhost:4000
```

### Issue: File uploads not working

**Solution:**
Make sure MinIO is running:
```bash
docker-compose up -d minio
docker-compose logs minio
```

Check MinIO bucket exists at http://localhost:9001

## Project Structure

```
MedReminder/
├── apps/
│   └── web/              # React web dashboard
├── services/
│   ├── api/              # Node.js backend
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   │   ├── auth/         # Authentication
│   │   │   │   ├── medications/  # Medication CRUD
│   │   │   │   ├── schedules/    # Schedule management
│   │   │   │   ├── dose-logs/    # Dose tracking
│   │   │   │   ├── health/       # Health measurements
│   │   │   │   ├── appointments/ # Appointments
│   │   │   │   ├── medfriends/   # Caregivers
│   │   │   │   └── ...
│   │   │   ├── common/   # Shared utilities
│   │   │   └── config/   # Configuration
│   │   └── prisma/       # Database schema
│   └── ai-engine/        # Python AI service
├── docker-compose.yml    # Docker configuration
└── README.md
```

## Next Steps

1. **Explore the features**: Add medications, log doses, track health measurements
2. **Check drug interactions**: Add multiple medications and see interaction warnings
3. **Invite MedFriends**: Share your schedule with caregivers
4. **View dashboard**: Monitor adherence and upcoming refills

## Additional Commands

```bash
# View all logs
docker-compose logs -f

# Stop all services
docker-compose down

# Reset everything (WARNING: deletes all data)
docker-compose down -v

# Rebuild Docker images
docker-compose up -d --build

# Database commands
cd services/api
npx prisma studio          # Open Prisma Studio (GUI)
npx prisma migrate dev     # Create new migration
npx prisma generate        # Regenerate client
```

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the API code in `services/api/src/modules/`
- Check browser console for frontend errors
- Check terminal output for backend errors

## Production Deployment

For production deployment:
1. Change all default passwords in `.env`
2. Set strong JWT secrets (minimum 32 characters)
3. Configure Firebase for push notifications
4. Set up SSL certificates
5. Configure database backups
6. Use Docker Compose production override file
