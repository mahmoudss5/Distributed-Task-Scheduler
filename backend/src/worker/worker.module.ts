import { Module } from '@nestjs/common';
import { WorkerService } from './workerService/worker.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Worker } from './entities/worker.entity';
import { Job } from '../jobs/entites/job.entity';
import { JobFailure } from '../jobs/entites/job-failure.entity';
import { RedisModule } from '../redis/redis.module';
import { JobsModule } from '../jobs/jobs.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Worker, Job, JobFailure]),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: config.get<string>('KAFKA_CLIENT_ID', `taskflow-worker-${process.pid}`),
              brokers: [config.get<string>('KAFKA_BROKER', 'localhost:9092')],
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
    RedisModule,
    JobsModule,
    EventsModule,
  ],
  providers: [WorkerService],
})
export class WorkerModule {}
