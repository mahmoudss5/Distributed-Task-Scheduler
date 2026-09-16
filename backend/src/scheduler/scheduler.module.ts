import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SchedulerService } from './Scheduler.service';
import { LeaderElectionService } from './LeaderElectionService';
import { KafkaLagService } from './kafka-lag.service';
import { JobsModule } from '../jobs/jobs.module';
import { RedisModule } from '../redis/redis.module';
import { Worker } from '../worker/entities/worker.entity';
import { Job } from '../jobs/entites/job.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Worker, Job]),
    JobsModule,
    RedisModule,
    AuditLogModule,
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: config.get<string>('KAFKA_CLIENT_ID', `taskflow-scheduler-${process.pid}`),
              brokers: [config.get<string>('KAFKA_BROKER', 'localhost:9092')],
            },
          },
        }),
      },
    ]),
  ],
  providers: [SchedulerService, LeaderElectionService, KafkaLagService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
