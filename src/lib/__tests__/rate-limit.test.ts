import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit } from '../rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
  });

  it('allows requests under the limit', () => {
    const id = `test-${Date.now()}-${Math.random()}`;
    const result = checkRateLimit(id, { windowMs: 60000, maxRequests: 10 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('tracks request count correctly', () => {
    const id = `test-${Date.now()}-${Math.random()}`;
    const config = { windowMs: 60000, maxRequests: 5 };
    
    checkRateLimit(id, config);
    checkRateLimit(id, config);
    const result = checkRateLimit(id, config);
    
    expect(result.remaining).toBe(2);
  });

  it('blocks requests over the limit', () => {
    const id = `test-${Date.now()}-${Math.random()}`;
    const config = { windowMs: 60000, maxRequests: 3 };
    
    checkRateLimit(id, config);
    checkRateLimit(id, config);
    checkRateLimit(id, config);
    const result = checkRateLimit(id, config);
    
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('uses different buckets for different identifiers', () => {
    const id1 = `test-1-${Date.now()}-${Math.random()}`;
    const id2 = `test-2-${Date.now()}-${Math.random()}`;
    const config = { windowMs: 60000, maxRequests: 2 };
    
    checkRateLimit(id1, config);
    checkRateLimit(id1, config);
    const result1 = checkRateLimit(id1, config);
    const result2 = checkRateLimit(id2, config);
    
    expect(result1.success).toBe(false);
    expect(result2.success).toBe(true);
  });
});
