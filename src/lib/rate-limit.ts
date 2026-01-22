/**
 * In-memory rate limiting implementation.
 * 
 * NOTE: This is suitable for development and single-instance deployments.
 * For production multi-instance/serverless deployments, consider using 
 * Redis-based rate limiting for shared state across instances.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = identifier;
  
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }
  
  if (existing.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: existing.resetTime - now,
    };
  }
  
  existing.count++;
  return {
    success: true,
    remaining: config.maxRequests - existing.count,
    resetIn: existing.resetTime - now,
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000);
