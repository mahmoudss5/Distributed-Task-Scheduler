import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { RedisModule } from '../redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Worker } from '../worker/entities/worker.entity';
import { HealthTokenGuard } from './health-token.guard';

@Module({
  imports: [
    TerminusModule,
    RedisModule,
    TypeOrmModule.forFeature([Worker]),
  ],
  controllers: [HealthController],
  providers: [HealthTokenGuard],
})
export class HealthModule {}
