import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './service/email.service';
import { EmailController } from './emailController/email.controller';
import { RedisModule } from '../redis/redis.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [ConfigModule, RedisModule, AuditLogModule],
  providers: [EmailService],
  controllers: [EmailController],

})
export class EmailModule {}
