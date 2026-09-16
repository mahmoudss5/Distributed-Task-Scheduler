import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly defaultLimit = 100;
  private readonly defaultWindowSeconds = 60;

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const custom = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    const options = custom ?? {
      limit: this.defaultLimit,
      windowSeconds: this.defaultWindowSeconds,
      keyPrefix: 'global',
    };
    const clientKey = this.getClientKey(request);
    const key = `rate-limit:${options.keyPrefix}:${clientKey}`;

    try {
      const result = await this.redisService.consumeTokenBucket(
        key,
        options.limit,
        options.windowSeconds,
      );
      const retryAfter = Math.max(1, Math.ceil(result.retryAfterSeconds));
      response.setHeader('X-RateLimit-Limit', options.limit);
      response.setHeader('X-RateLimit-Remaining', result.remaining);
      response.setHeader('Retry-After', retryAfter);

      if (!result.allowed) {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;

      // Redis failure should not take the whole API offline. The failure is
      // logged and the request is allowed through until Redis recovers.
      this.redisService.logRateLimitFailure(error);
    }

    return true;
  }

  private getClientKey(request: any): string {
    // The proxy must be configured to overwrite, not append, X-Forwarded-For.
    return request.user?.id ?? request.ip ?? request.socket?.remoteAddress ?? 'unknown';
  }
}
