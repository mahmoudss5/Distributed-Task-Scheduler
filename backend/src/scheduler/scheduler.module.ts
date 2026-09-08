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

@Module({
  imports: [
    TypeOrmModule.forFeature([Worker, Job]),
    JobsModule,
    RedisModule,
    AuditLogModule,
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'my-app',
            brokers: ['localhost:9092'],
          },
        },
      },
    ]),
  ],
  providers: [SchedulerService, LeaderElectionService, KafkaLagService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
