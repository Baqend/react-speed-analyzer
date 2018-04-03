import NodeCache from 'node-cache';
import { RateLimiter } from 'limiter';
import { Request } from 'express'
import { EntityManager } from 'baqend'

const cache = new NodeCache({ stdTTL: 600, checkperiod: 600, useClones: false });

/**
 * Checks if an IP address is rate-limited.
 *
 * @param req the request object containing the IP
 * @param reqPerMinute allowed requests per minute
 * @returns {boolean} true if the user is rate limited
 */
export function isRateLimited(req: Request, reqPerMinute: number = 8): boolean {
    const ip = req.get('X-Forwarded-For');
    // Do not block Baqend
    if (ip.includes('134.100.11.49')) {
        return false;
    }

    let limiter: RateLimiter = cache.get(ip);
    if (limiter === undefined) {
        limiter = new RateLimiter(reqPerMinute, 'minute', true);
        cache.set(ip, limiter);
    }
    return !limiter.tryRemoveTokens(1);
}

export function call(db: EntityManager, data: any, req: Request) {
  return { isRateLimited: isRateLimited(req) };
}
