import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(RedisService.name);

  private readonly tokenBucketScript = `
    local key = KEYS[1]
    local capacity = tonumber(ARGV[1])
    local refillPerSecond = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local cost = tonumber(ARGV[4])
    local state = redis.call('HMGET', key, 'tokens', 'timestamp')
    local tokens = tonumber(state[1])
    local timestamp = tonumber(state[2])

    if tokens == nil then
      tokens = capacity
      timestamp = now
    else
      tokens = math.min(capacity, tokens + math.max(0, now - timestamp) * refillPerSecond)
      timestamp = now
    end

    local allowed = 0
    if tokens >= cost then
      tokens = tokens - cost
      allowed = 1
    end

    redis.call('HSET', key, 'tokens', tokens, 'timestamp', timestamp)
    redis.call('EXPIRE', key, math.ceil(capacity / refillPerSecond) + 60)
    local retryAfter = 0
    if allowed == 0 then
      retryAfter = (cost - tokens) / refillPerSecond
    end
    return { allowed, math.floor(tokens), retryAfter }
  `;

  private readonly renewLeaseScript = `
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      return redis.call('EXPIRE', KEYS[1], ARGV[2])
    end
    return 0
  `;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    
    this.redisClient = new Redis({
      host,
      port,
      lazyConnect: true,
    });
  }

  async onModuleInit() {
    try {
      await this.redisClient.connect();
      this.logger.log('Connected to Redis successfully');
    } catch (error) {
      this.logger.error('Could not connect to Redis', error);
    }
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  getClient(): Redis {
    return this.redisClient;
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (ttlSeconds) {
      return this.redisClient.set(key, value, 'EX', ttlSeconds);
    }
    return this.redisClient.set(key, value);
  }
  async setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redisClient.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }
  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async increment(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    return this.redisClient.expire(key, ttlSeconds);
  }

  async consumeTokenBucket(
    key: string,
    capacity: number,
    windowSeconds: number,
    cost = 1,
  ): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
    const refillPerSecond = capacity / windowSeconds;
    const result = (await this.redisClient.eval(
      this.tokenBucketScript,
      1,
      key,
      capacity,
      refillPerSecond,
      Date.now() / 1000,
      cost,
    )) as [number, number, number];
    return {
      allowed: result[0] === 1,
      remaining: result[1],
      retryAfterSeconds: result[2],
    };
  }

  async renewLease(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redisClient.eval(
      this.renewLeaseScript,
      1,
      key,
      value,
      ttlSeconds,
    );
    return result === 1;
  }

  logRateLimitFailure(error: unknown): void {
    this.logger.warn(
      `Rate limiting is temporarily unavailable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
