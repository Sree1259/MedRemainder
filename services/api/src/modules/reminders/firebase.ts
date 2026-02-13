import admin from 'firebase-admin';
import { config } from '@config/index';
import { logger } from '@common/logger';

let firebaseInitialized = false;

export const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    // Check if Firebase credentials are configured
    if (!config.FIREBASE_PROJECT_ID || !config.FIREBASE_PRIVATE_KEY) {
      logger.warn('Firebase credentials not configured. Push notifications will be disabled.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FIREBASE_PROJECT_ID,
        privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
      }),
    });

    firebaseInitialized = true;
    logger.info('Firebase initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error);
  }
};

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendPushNotification = async (
  token: string,
  payload: NotificationPayload
): Promise<void> => {
  if (!firebaseInitialized) {
    logger.warn('Firebase not initialized. Skipping push notification.');
    return;
  }

  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      token,
    };

    await admin.messaging().send(message);
    logger.debug(`Push notification sent to token: ${token.substring(0, 10)}...`);
  } catch (error: any) {
    // Handle invalid token
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      logger.warn(`Invalid FCM token: ${token}`);
      // TODO: Remove invalid token from database
    } else {
      logger.error('Failed to send push notification:', error);
      throw error;
    }
  }
};

export const sendMulticastNotification = async (
  tokens: string[],
  payload: NotificationPayload
): Promise<void> => {
  if (!firebaseInitialized || tokens.length === 0) {
    return;
  }

  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    logger.info(
      `Multicast sent: ${response.successCount} successful, ${response.failureCount} failed`
    );

    // Handle failed tokens
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          logger.warn(`Failed to send to token ${tokens[idx]}: ${resp.error?.message}`);
        }
      });
    }
  } catch (error) {
    logger.error('Failed to send multicast notification:', error);
    throw error;
  }
};
