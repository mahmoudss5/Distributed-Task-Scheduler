import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './service/email.service';
import { EmailController } from './emailController/email.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
     isGlobal: true,
    }
    )
  ],
  providers: [EmailService],
  controllers: [EmailController],

})
export class EmailModule {}
