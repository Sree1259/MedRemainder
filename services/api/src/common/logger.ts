import winston from 'winston';
import { config } from '@config/index';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  if (stack) {
    msg += `\n${stack}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: config.isDev ? 'debug' : 'info',
  defaultMeta: { service: 'medreminder-api' },
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp(),
        errors({ stack: true }),
        config.isDev ? combine(colorize(), devFormat) : json()
      ),
    }),
  ],
});

// Stream for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
