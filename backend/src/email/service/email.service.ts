import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AuditLogAction } from '../../audit-log/enums/audit-log-action.enum';
import {RedisService} from "../../redis/redis.service";

@Injectable()
export class EmailService  implements OnModuleInit{
  private readonly transporter: nodemailer.Transporter;
  private readonly emailUser: string;

  constructor(private readonly config: ConfigService,
              private readonly auditLogService: AuditLogService,
              private readonly redisService:RedisService
              ) {
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



 async storeOtpInRedis(opt:string,email:string){
    const key=`otp:${email}`;
    const expirationTimeInSeconds=5*60;
    return this.redisService.set(key,opt,expirationTimeInSeconds);
  }

  generateOtp():string{
    let len:number=6;
    let chars='0123456789';
    let otp='';
    for(let i=0;i<len;i++){
      otp+=chars.charAt(Math.floor(Math.random()*chars.length));
    }
    return otp;
  }




  async sendOtp(to: string) {
    const otp = this.generateOtp();
    await this.storeOtpInRedis(otp, to);

    return this.transporter.sendMail({
      from: `"Distributed Task Platform" <${this.emailUser}>`,
      to,
      subject: 'Your OTP Code for Distributed Task Platform',
      text: `Your OTP code is ${otp}. It expires in 5 minutes. If you did not request this, please ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f7f6;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              overflow: hidden;
            }
            .header {
              background-color: #4a90e2;
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
              color: #333333;
              text-align: center;
            }
            .content p {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 20px;
              color: #555555;
            }
            .otp-container {
              margin: 30px 0;
            }
            .otp-code {
              display: inline-block;
              background-color: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 6px;
              padding: 15px 40px;
              font-size: 36px;
              font-weight: 700;
              color: #4a90e2;
              letter-spacing: 8px;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #999999;
              font-size: 14px;
              border-top: 1px solid #eeeeee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Security Verification</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to access your account. Please use the following One-Time Password (OTP) to complete your verification:</p>
              <div class="otp-container">
                <div class="otp-code">${otp}</div>
              </div>
              <p>This code is valid for <strong>5 minutes</strong>. For your security, do not share this code with anyone.</p>
              <p>If you did not request this verification, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Distributed Task Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendEmail(to: string, subject: string, body: string) {
    return this.transporter.sendMail({
      from: `"Distributed Task Platform" <${this.emailUser}>`,
      to,
      subject,
      html: body,
    });
  }

}
