import ActivityLog from '@/lib/models/ActivityLog';
import connectDB from '@/lib/database';

/**
 * Log authentication events
 */
export async function logAuthEvent(
  userId: string,
  action: 'user_login' | 'user_logout' | 'user_registered',
  details: {
    method?: 'google' | 'email' | 'phone' | 'phone-password';
    email?: string;
    phone?: string;
    [key: string]: any;
  },
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await connectDB();
    await ActivityLog.logActivity(
      userId,
      action,
      'auth',
      details,
      undefined,
      {
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown'
      }
    );
    console.log(`📊 Auth event logged: ${action} for user ${userId}`);
  } catch (error) {
    console.error('Error logging auth event:', error);
    // Don't throw - auth should succeed even if logging fails
  }
}

/**
 * Log wallet operations
 */
export async function logWalletEvent(
  userId: string,
  action: string,
  details: {
    address?: string;
    amount?: string;
    token?: string;
    transactionHash?: string;
    [key: string]: any;
  },
  petId?: string
) {
  try {
    await connectDB();
    await ActivityLog.logActivity(
      userId,
      action,
      'wallet',
      details,
      petId
    );
    console.log(`📊 Wallet event logged: ${action}`);
  } catch (error) {
    console.error('Error logging wallet event:', error);
  }
}

/**
 * Log social interactions
 */
export async function logSocialEvent(
  userId: string,
  action: string,
  details: {
    friendAddress?: string;
    friendName?: string;
    messageLength?: number;
    [key: string]: any;
  }
) {
  try {
    await connectDB();
    await ActivityLog.logActivity(
      userId,
      action,
      'social',
      details
    );
    console.log(`📊 Social event logged: ${action}`);
  } catch (error) {
    console.error('Error logging social event:', error);
  }
}

/**
 * Log system events
 */
export async function logSystemEvent(
  userId: string,
  action: string,
  details: {
    errorType?: string;
    errorMessage?: string;
    endpoint?: string;
    [key: string]: any;
  },
  petId?: string
) {
  try {
    await connectDB();
    await ActivityLog.logActivity(
      userId,
      action,
      'system',
      details,
      petId
    );
    console.log(`📊 System event logged: ${action}`);
  } catch (error) {
    console.error('Error logging system event:', error);
  }
}
