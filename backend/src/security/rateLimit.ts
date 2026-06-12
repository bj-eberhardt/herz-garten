import type { RequestHandler } from 'express';
import { sendApiError } from '../errors.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  return (request, response, next) => {
    if (options.max <= 0) {
      next();
      return;
    }

    const now = Date.now();
    const key = `${options.keyPrefix}:${request.ip}:${request.path}`;
    const current = buckets.get(key);
    const bucket = current && current.resetAt > now ? current : { count: 0, resetAt: now + options.windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);

    response.setHeader('RateLimit-Limit', String(options.max));
    response.setHeader('RateLimit-Remaining', String(Math.max(options.max - bucket.count, 0)));
    response.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > options.max) {
      sendApiError(response, 429, 'common.rateLimited');
      return;
    }

    next();
  };
}

export function clearRateLimitBuckets() {
  buckets.clear();
}
