import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '@config/index';
import { logger, stream } from '@common/logger';
import { errorHandler, notFoundHandler } from '@common/errorHandler';
import { 
  securityHeaders, 
  corsOptions, 
  standardRateLimiter, 
  authRateLimiter,
  requestLogger 
} from '@common/security';

// Import routes
import authRoutes from '@modules/auth/auth.routes';
import medicationRoutes from '@modules/medications/medication.routes';
import scheduleRoutes from '@modules/schedules/schedule.routes';
import doseLogRoutes from '@modules/dose-logs/dose-log.routes';
import healthRoutes from '@modules/health/health.routes';
import appointmentRoutes from '@modules/appointments/appointment.routes';
import medfriendRoutes from '@modules/medfriends/medfriend.routes';
import pharmacyRoutes from '@modules/pharmacies/pharmacy.routes';
import interactionRoutes from '@modules/interactions/interaction.routes';
import subscriptionRoutes from '@modules/subscriptions/subscription.routes';
import userRoutes from '@modules/users/user.routes';

const app: Application = express();

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));

// Rate limiting
app.use(standardRateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP logging (sanitized)
app.use(morgan('combined', { stream }));
app.use(requestLogger);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.NODE_ENV,
  });
});

// API routes
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/medications', medicationRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/dose-logs', doseLogRoutes);
app.use('/api/v1/health-measurements', healthRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/medfriends', medfriendRoutes);
app.use('/api/v1/pharmacies', pharmacyRoutes);
app.use('/api/v1/interactions', interactionRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/users', userRoutes);

// Handle 404
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    app.listen(config.PORT, () => {
      logger.info(`🚀 Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
      logger.info(`📚 API Documentation: http://localhost:${config.PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
