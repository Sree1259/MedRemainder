import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@config/index';
import { prisma } from '@common/prisma';
import { AppError } from '@common/errorHandler';
import { logger } from '@common/logger';

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  isPremium: boolean;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateTokens = (payload: TokenPayload): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId: payload.userId }, config.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  
  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as { userId: string };
};

export const registerUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  timezone?: string;
  locale?: string;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('User already exists with this email', 409);
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      timezone: data.timezone || 'America/New_York',
      locale: data.locale || 'en-US',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isPremium: true,
      timezone: true,
      locale: true,
      createdAt: true,
    },
  });

  logger.info(`New user registered: ${user.email}`);

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
    isPremium: user.isPremium,
  });

  return { user, ...tokens };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  logger.info(`User logged in: ${user.email}`);

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
    isPremium: user.isPremium,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isPremium: user.isPremium,
      timezone: user.timezone,
      locale: user.locale,
      avatarUrl: user.avatarUrl,
    },
    ...tokens,
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const { userId } = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isPremium: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    });

    return tokens;
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  logger.info(`Password changed for user: ${user.email}`);

  return { message: 'Password updated successfully' };
};
