import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from './jobs/jobs.module';
import { WorkerModule } from './worker/worker.module';
import { RedisModule } from './redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './scheduler/scheduler.module';
export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
    JobsModule,
    WorkerModule,
    RedisModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // Set to false in production!
      }),
    }),
    ClientsModule.register({
      clients: [
        {
          name: 'KAFKA_SERVICE',
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'my-app',
              brokers: ['localhost:9092'],
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        },
      ],
    }),
    ScheduleModule.forRoot(),
    SchedulerModule,
    WorkerModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
