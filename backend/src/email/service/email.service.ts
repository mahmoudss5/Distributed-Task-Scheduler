import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AuditLogAction } from '../../audit-log/enums/audit-log-action.enum';

@Injectable()
export class EmailService  implements OnModuleInit{
  private readonly transporter: nodemailer.Transporter;
  private readonly emailUser: string;

  constructor(private readonly config: ConfigService,
              private readonly auditLogService: AuditLogService,) {
    this.emailUser = this.config.getOrThrow<string>('EMAIL_USER');

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.emailUser,
        pass: this.config.getOrThrow<string>('EMAIL_APP_PASSWORD'),
      },
    });
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      console.log('Gmail connection is working');
    } catch (error) {
      console.error('Gmail connection failed', error);
      await this.auditLogService.createLog(
        AuditLogAction.EMAIL_CONNECTION_FAILED,
        'EmailService',
        'Gmail',
        undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
    }
  }

  async sendOtp(to: string, otp: string) {
    return this.transporter.sendMail({
      from: `"My NestJS App" <${this.emailUser}>`,
      to,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
      html: `
        <h2>Your OTP Code</h2>
        <h1>${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      `,
    });
  }
}
