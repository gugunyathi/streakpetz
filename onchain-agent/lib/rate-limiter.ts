import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (in production, use Redis)
const rateLimitStore: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
}

/**
 * Rate limiting middleware
 * Default: 100 requests per 15 minutes per IP
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests, please try again later.'
  } = config;

  return function rateLimit(request: NextRequest): NextResponse | null {
    // Get client identifier (IP address)
    const identifier = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const key = `${identifier}:${request.nextUrl.pathname}`;
    const now = Date.now();

    // Get or initialize rate limit data
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // Increment request count
    rateLimitStore[key].count++;

    // Check if limit exceeded
    if (rateLimitStore[key].count > maxRequests) {
      const resetTime = rateLimitStore[key].resetTime;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return NextResponse.json(
        { 
          success: false, 
          error: message,
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString()
          }
        }
      );
    }

    // Add rate limit headers to response (if needed)
    // This will be handled by the route handler

    return null; // No rate limit exceeded
  };
}

/**
 * Preset rate limiters for common use cases
 */
export const rateLimiters = {
  // Strict: 20 requests per minute (auth endpoints)
  strict: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many authentication attempts. Please try again later.'
  }),

  // Moderate: 100 requests per 15 minutes (API endpoints)
  moderate: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests. Please slow down.'
  }),

  // Generous: 1000 requests per hour (read-only endpoints)
  generous: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    message: 'Rate limit exceeded. Please try again later.'
  }),

  // Transaction: 10 requests per minute (transaction endpoints)
  transaction: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many transactions. Please wait before trying again.'
  })
};

/**
 * Usage in API routes:
 * 
 * import { rateLimiters } from '@/lib/rate-limiter';
 * 
 * export async function POST(request: NextRequest) {
 *   // Apply rate limiting
 *   const rateLimitResponse = rateLimiters.strict(request);
 *   if (rateLimitResponse) return rateLimitResponse;
 *   
 *   // Continue with normal request handling
 *   // ...
 * }
 */

/**
 * Get rate limit info for debugging
 */
export function getRateLimitInfo(identifier: string, pathname: string) {
  const key = `${identifier}:${pathname}`;
  const data = rateLimitStore[key];
  
  if (!data) {
    return { count: 0, resetTime: null };
  }
  
  return {
    count: data.count,
    resetTime: new Date(data.resetTime).toISOString()
  };
}
