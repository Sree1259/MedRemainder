import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '@config/index';
import { logger } from './logger';

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// CORS configuration
export const corsOptions = {
  origin: config.isProd ? config.CLIENT_URL : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Rate limiters for different routes
export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: { message: 'Too many requests, please try again later' },
    });
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts',
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: { message: 'Too many authentication attempts, please try again later' },
    });
  },
});

// Sanitize request body to remove sensitive fields from logs
export const sanitizeBody = (body: Record<string, any>): Record<string, any> => {
  const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'secret', 'apiKey'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

// Request logging middleware (sanitized)
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Only log in development or if explicitly enabled
  if (!config.isDev) {
    return next();
  }

  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    // Log body only in development and sanitize it
    if (Object.keys(req.body).length > 0) {
      Object.assign(logData, { body: sanitizeBody(req.body) });
    }

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.debug('Request completed', logData);
    }
  });

  next();
};

// Error sanitization for production
export const sanitizeError = (error: any): any => {
  if (config.isDev) {
    return error;
  }

  // In production, remove stack traces and sensitive info
  if (typeof error === 'object' && error !== null) {
    const { stack, ...safeError } = error;
    return safeError;
  }
  
  return error;
};
