import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesCache: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailEnabled = this.configService.get<string>('EMAIL_ENABLED', 'false') === 'true';

    if (!emailEnabled) {
      this.logger.warn('Email service is disabled. Set EMAIL_ENABLED=true to enable.');
      // Create a dummy transporter for development
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      return;
    }

    const host = this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com');
    const port = parseInt(this.configService.get<string>('EMAIL_PORT', '587'), 10);
    const secure = this.configService.get<string>('EMAIL_SECURE', 'false') === 'true';
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');

    if (!user || !pass) {
      this.logger.warn(
        'EMAIL_USER or EMAIL_PASS not configured. Email service will not work properly.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth:
        user && pass
          ? {
              user,
              pass,
            }
          : undefined,
    });

    this.logger.log(`Email service initialized with host: ${host}:${port}`);
  }

  private async loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    // Check cache first
    if (this.templatesCache.has(templateName)) {
      return this.templatesCache.get(templateName)!;
    }

    const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);

    try {
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const compiledTemplate = handlebars.compile(templateContent);
      this.templatesCache.set(templateName, compiledTemplate);
      return compiledTemplate;
    } catch (error) {
      this.logger.error(`Failed to load email template: ${templateName}`, error);
      throw new Error(`Email template not found: ${templateName}`);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const template = await this.loadTemplate(options.template);
      const html = template(options.context);

      const from = this.configService.get<string>('EMAIL_FROM', 'noreply@jobboard.com');

      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent to ${options.to}: ${info.messageId || 'no-id'}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      return false;
    }
  }

  // Welcome email for new users
  async sendWelcomeEmail(email: string, username: string, userType: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: '잡보드에 오신 것을 환영합니다!',
      template: 'welcome',
      context: {
        username,
        userType: userType === 'PERSONAL' ? '구직자' : '기업',
        loginUrl:
          this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/login',
        year: new Date().getFullYear(),
      },
    });
  }

  // Application status change notification
  async sendApplicationStatusEmail(
    email: string,
    jobTitle: string,
    companyName: string,
    status: string,
  ): Promise<boolean> {
    const statusText = this.getStatusText(status);

    return this.sendEmail({
      to: email,
      subject: `[잡보드] ${companyName} - ${jobTitle} 지원 상태 업데이트`,
      template: 'application-status',
      context: {
        jobTitle,
        companyName,
        status: statusText,
        dashboardUrl:
          this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/applications',
        year: new Date().getFullYear(),
      },
    });
  }

  // Payment confirmation email
  async sendPaymentConfirmationEmail(
    email: string,
    orderNumber: string,
    amount: number,
    description: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: '[잡보드] 결제 완료 안내',
      template: 'payment-confirmation',
      context: {
        orderNumber,
        amount: amount.toLocaleString('ko-KR'),
        description,
        receiptUrl:
          this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') +
          `/orders/${orderNumber}`,
        year: new Date().getFullYear(),
      },
    });
  }

  // Application received notification for recruiters
  async sendApplicationReceivedEmail(
    email: string,
    jobTitle: string,
    applicantName: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `[잡보드] ${jobTitle} 포지션에 새로운 지원자가 있습니다`,
      template: 'application-received',
      context: {
        jobTitle,
        applicantName,
        applicationsUrl:
          this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/applications',
        year: new Date().getFullYear(),
      },
    });
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      ACTIVE: '검토 중',
      WITHDRAWN_BY_USER: '지원 철회',
      HIRED: '최종 합격',
      REJECTED_BY_COMPANY: '불합격',
    };
    return statusMap[status] || status;
  }
}
