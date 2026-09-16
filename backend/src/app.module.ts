import { Module } from '@nestjs/common';
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
import { AuditLogModule } from './audit-log/audit-log.module';
import { EmailModule } from './email/email.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ReportModule } from './report/report.module';
import { HealthModule } from './health/health.module';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { SystemModule } from './system/system.module';
@Module({
  imports: [
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
        migrations: [__dirname + '/migrations/*{.js,.ts}'],
        synchronize: config.get(
          'DB_SYNCHRONIZE',
          config.get('NODE_ENV', 'development') === 'production' ? 'false' : 'true',
        ) === 'true',
        migrationsRun: config.get(
          'DB_MIGRATIONS_RUN',
          config.get('NODE_ENV', 'development') === 'production' ? 'true' : 'false',
        ) === 'true',
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
            brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
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
    AuditLogModule,
    EmailModule,
    UsersModule,
    AuthModule,
    ReportModule,
    HealthModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [AppService, RateLimitGuard],
})
export class AppModule { }
