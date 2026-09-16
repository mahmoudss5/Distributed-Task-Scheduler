import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MicroserviceHealthIndicator,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker } from '../worker/entities/worker.entity';
import { RedisService } from '../redis/redis.service';
import { HealthTokenGuard } from './health-token.guard';

@Controller('health')
@UseGuards(HealthTokenGuard)
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private healthIndicator: HealthIndicatorService,
    private redisService: RedisService,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
  ) {
  }

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // MySQL
      () => this.db.pingCheck('mysql'),

      // Kafka
      () =>
        this.microservice.pingCheck('kafka', {
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
            },
          },
        }),

      // Redis
      async () => {
        try {
          await this.redisService.getClient().ping();
          return this.healthIndicator.check('redis').up();
        } catch {
          return this.healthIndicator.check('redis').down({ message: 'Redis check failed' });
        }
      },

      // Worker
      async () => {
        const workerIndicator = this.healthIndicator.check('worker');
        try {
          // Check if there is at least one active worker heartbeat in the last 2 minutes
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          const activeWorker = await this.workerRepository
            .createQueryBuilder('worker')
            .where('worker.status = :status', { status: 'active' })
            .andWhere('worker.lastHeartbeat >= :time', { time: twoMinutesAgo })
            .getOne();

          const isHealthy = !!activeWorker;
          return isHealthy
            ? workerIndicator.up({ message: 'Worker is active' })
            : workerIndicator.down({ message: 'No active workers found in the last 2 minutes' });
        } catch {
          return workerIndicator.down({ message: 'Worker check failed' });
        }
      },
    ]);
  }
}
