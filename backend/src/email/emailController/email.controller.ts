import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EmailService } from '../service/email.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
}

class SendEmailDto implements SendEmailRequest {
  @IsEmail()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email')
export class EmailController {

  constructor(
    private readonly emailService: EmailService
  ) {}

  @Post('send-email')
  @Roles(Role.ADMIN)
  async sendEmail(@Body() sendEmailRequest: SendEmailDto) {
    const { to, subject, body } = sendEmailRequest;
    await this.emailService.sendEmail(to, subject, body);
    return { message: 'Email sent successfully' };
  }
  

}
