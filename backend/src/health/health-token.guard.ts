import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class HealthTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configuredToken = this.config.get<string>('HEALTH_TOKEN');
    const environment = this.config.get<string>('NODE_ENV', 'development');

    if (!configuredToken) return environment !== 'production';

    const request = context.switchToHttp().getRequest();
    const suppliedToken = request.headers['x-health-token'];
    if (typeof suppliedToken !== 'string') return false;

    const expected = Buffer.from(configuredToken);
    const supplied = Buffer.from(suppliedToken);
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
  }
}
