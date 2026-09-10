import { Controller, Get, Query } from '@nestjs/common';
import { EmailService } from '../service/email.service';

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
}

@Controller('email')
export class EmailController {

  constructor(
    private readonly emailService: EmailService
  ) {}

  @Get('send-email')
  async sendEmail(@Query() sendEmailRequest: SendEmailRequest) {
    const { to, subject, body } = sendEmailRequest;
    await this.emailService.sendEmail(to, subject, body);
    return { message: 'Email sent successfully' };
  }
  

}
