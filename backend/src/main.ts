import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { RateLimitGuard } from './common/guards/rate-limit.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const configuredOrigins = config
    .get<string>('CORS_ORIGIN', 'http://localhost,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allowed?: boolean) => void,
    ) => {
      if (!origin || configuredOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS origin is not allowed'), false);
      }
    },
  });
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.useGlobalGuards(app.get(RateLimitGuard));
  app.enableShutdownHooks();
  app.useWebSocketAdapter(new WsAdapter(app));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: config.get<string>('KAFKA_CLIENT_ID', `taskflow-${process.pid}`),
        brokers: [config.get<string>('KAFKA_BROKER', 'localhost:9092')],
      },
      consumer: {
        groupId: config.get<string>('KAFKA_GROUP_ID', 'taskflow-workers'),
      },
    },
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.startAllMicroservices();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Distributed Task Platform API')
    .setDescription('The API description for the distributed task platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.get<number>('PORT', 3000));
}
bootstrap();
