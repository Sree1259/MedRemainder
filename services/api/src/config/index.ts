import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.string().default('9000'),
  MINIO_USE_SSL: z.string().default('false'),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET_NAME: z.string().default('medreminder'),
  API_URL: z.string().default('http://localhost:4000'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Log validation errors without exposing sensitive values
  const formattedErrors = Object.entries(parsed.error.format())
    .filter(([key]) => key !== '_errors')
    .map(([key, value]) => {
      const errors = (value as any)._errors || [];
      return `${key}: ${errors.join(', ')}`;
    });
  
  // Use console.error only at startup before logger is initialized
  // This is acceptable for fatal startup errors
  console.error('❌ Environment validation failed:');
  formattedErrors.forEach((err) => console.error(`  - ${err}`));
  console.error('\nPlease check your .env file and ensure all required variables are set correctly.');
  process.exit(1);
}

export const config = {
  ...parsed.data,
  PORT: parseInt(parsed.data.PORT, 10),
  MINIO_PORT: parseInt(parsed.data.MINIO_PORT, 10),
  MINIO_USE_SSL: parsed.data.MINIO_USE_SSL === 'true',
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
};

export type Config = typeof config;
