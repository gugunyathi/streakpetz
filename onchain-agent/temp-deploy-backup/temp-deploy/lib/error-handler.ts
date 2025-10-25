// Error handling utilities for production-ready application

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
}

export class StreakPetsError extends Error {
  public code: string;
  public details?: unknown;
  public timestamp: Date;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'StreakPetsError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

// Error codes for different types of errors
export const ERROR_CODES = {
  // Wallet errors
  WALLET_CONNECTION_FAILED: 'WALLET_CONNECTION_FAILED',
  WALLET_CREATION_FAILED: 'WALLET_CREATION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',

  // XMTP errors
  XMTP_INIT_FAILED: 'XMTP_INIT_FAILED',
  XMTP_MESSAGE_FAILED: 'XMTP_MESSAGE_FAILED',
  XMTP_CONNECTION_LOST: 'XMTP_CONNECTION_LOST',

  // AI errors
  AI_RESPONSE_FAILED: 'AI_RESPONSE_FAILED',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',

  // Pet errors
  PET_CREATION_FAILED: 'PET_CREATION_FAILED',
  PET_UPDATE_FAILED: 'PET_UPDATE_FAILED',
  PET_NOT_FOUND: 'PET_NOT_FOUND',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
} as const;

// Error handler function
export function handleError(error: Error | unknown, context?: string): AppError {
  console.error(`Error in ${context || 'unknown context'}:`, error);

  // If it's already a StreakPetsError, return it as AppError
  if (error instanceof StreakPetsError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp
    };
  }

  // Handle specific error types
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    if (error.message.includes('wallet')) {
      return {
        code: ERROR_CODES.WALLET_CONNECTION_FAILED,
        message: 'Failed to connect to wallet. Please try again.',
        details: error,
        timestamp: new Date()
      };
    }

    if (error.message.includes('XMTP')) {
      return {
        code: ERROR_CODES.XMTP_INIT_FAILED,
        message: 'Failed to initialize chat. Please check your connection.',
        details: error,
        timestamp: new Date()
      };
    }

    if (error.message.includes('OpenAI') || error.message.includes('AI')) {
      return {
        code: ERROR_CODES.AI_RESPONSE_FAILED,
        message: 'AI response temporarily unavailable. Please try again.',
        details: error,
        timestamp: new Date()
      };
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: 'Network connection issue. Please check your internet.',
        details: error,
        timestamp: new Date()
      };
    }
  }

  // Default error
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: 'An unexpected error occurred. Please try again.',
    details: error,
    timestamp: new Date()
  };
}

// Retry utility for failed operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw new StreakPetsError(
          ERROR_CODES.UNKNOWN_ERROR,
          `Operation failed after ${maxRetries} attempts`,
          error
        );
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
}

// Graceful degradation for non-critical features
export function withFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  return operation().catch(error => {
    console.warn(`Operation failed in ${context}, using fallback:`, error);
    return fallback;
  });
}

// User-friendly error messages
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.code) {
    case ERROR_CODES.WALLET_CONNECTION_FAILED:
      return 'Unable to connect to your wallet. Please check your wallet extension and try again.';
    
    case ERROR_CODES.XMTP_INIT_FAILED:
      return 'Chat feature is temporarily unavailable. You can still interact with your pet using the action buttons.';
    
    case ERROR_CODES.AI_RESPONSE_FAILED:
      return 'AI responses are temporarily unavailable. Your pet actions will still work normally.';
    
    case ERROR_CODES.NETWORK_ERROR:
      return 'Network connection issue detected. Some features may be limited until connection is restored.';
    
    case ERROR_CODES.INSUFFICIENT_FUNDS:
      return 'Insufficient funds for this transaction. Please add funds to your wallet.';
    
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}