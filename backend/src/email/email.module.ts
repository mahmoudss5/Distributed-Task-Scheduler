import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './service/email.service';

@Module({
  imports: [
    ConfigModule.forRoot({
     isGlobal: true,
    }
    )
  ],
  providers: [EmailService],

})
export class EmailModule {}
