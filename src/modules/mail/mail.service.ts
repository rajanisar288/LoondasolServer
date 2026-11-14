import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface VerificationEmailData {
  name: string;
  companyName: string;
  code: string;
  expiresInMinutes: number;
}

export interface EmployeeInvitationEmailData {
  employeeName: string;
  companyName: string;
  designation: string;
  departmentName?: string;
  inviteLink: string;
  expiresInHours: number;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress =
      this.configService.get<string>('EMAIL_FROM') ||
      'WorkivLab <dev.m.nisar191@gmail.com>';
    this.initTransporter();
  }

  // Initializes SMTP transporter with Gmail or configured host
  private initTransporter(): void {
    const host = this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<number>('EMAIL_PORT', 587));
    const secure =
      this.configService.get<string>('EMAIL_SECURE', 'false') === 'true';
    const user = this.configService.get<string>('EMAIL_USER');
    const rawPass = this.configService.get<string>('EMAIL_PASS') || '';
    // Strip any accidental whitespace from app passwords
    const pass = rawPass.replace(/\s+/g, '');

    if (!user || !pass) {
      this.logger.warn(
        'Email credentials not fully configured; mail delivery disabled in dev mode',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.transporter.verify((err) => {
      if (err) {
        this.logger.error(
          `SMTP connection verification failed: ${err.message}`,
        );
      } else {
        this.logger.log(
          `SMTP transporter ready for mail delivery via ${host}:${port}`,
        );
      }
    });
  }

  // Sends professional 6-digit company verification code email
  async sendVerificationCodeEmail(
    to: string,
    data: VerificationEmailData,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `Transporter unavailable; skipping verification code email to ${to}`,
      );
      return false;
    }

    const subject = `${data.code} is your WorkivLab verification code`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #2A65F6; padding: 32px 40px; text-align: center;">
              <table align="center" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.2); width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 22px; font-weight: bold; line-height: 44px;">◈</span>
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">WorkivLab</span>
                    <br>
                    <span style="color: rgba(255, 255, 255, 0.8); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Enterprise SaaS Platform</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h1 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                Verify your workspace email
              </h1>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 24px;">
                Hello <strong>${data.name}</strong>,<br>
                Thank you for registering <strong>${data.companyName}</strong> on WorkivLab. Please use the following 6-digit verification code to confirm your email and activate your workspace.
              </p>
              
              <div style="background-color: #eff4fe; border: 2px dashed #2A65F6; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
                <span style="display: block; color: #2A65F6; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                  Your Verification Code
                </span>
                <span style="display: block; font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 36px; font-weight: 800; color: #0f172a; letter-spacing: 8px;">
                  ${data.code}
                </span>
                <span style="display: block; color: #64748b; font-size: 12px; margin-top: 10px;">
                  Expires in ${data.expiresInMinutes} minutes
                </span>
              </div>

              <p style="margin: 0 0 20px 0; color: #64748b; font-size: 13px; line-height: 20px;">
                If you did not initiate this workspace registration, please disregard this email. Your email address remains secure.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 18px;">
                &copy; ${new Date().getFullYear()} WorkivLab Multi-Tenant SaaS Platform. All rights reserved.<br>
                Secured by regional data sovereignty & cryptographic tenant isolation.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
        text: `Your WorkivLab verification code is: ${data.code}. It will expire in ${data.expiresInMinutes} minutes.`,
      });
      this.logger.log(`Verification email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to send verification email to ${to}: ${error.message}`,
      );
      return false;
    }
  }

  // Sends professional employee invitation email with one-click joining link
  async sendEmployeeInvitationEmail(
    to: string,
    data: EmployeeInvitationEmailData,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `Transporter unavailable; skipping invitation email to ${to}`,
      );
      return false;
    }

    const subject = `You've been invited to join ${data.companyName} on WorkivLab`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #2A65F6; padding: 32px 40px; text-align: center;">
              <table align="center" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.2); width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 22px; font-weight: bold; line-height: 44px;">◈</span>
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">WorkivLab</span>
                    <br>
                    <span style="color: rgba(255, 255, 255, 0.8); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Team Workspace</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h1 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                Join ${data.companyName} on WorkivLab
              </h1>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 24px;">
                Hello <strong>${data.employeeName}</strong>,<br>
                You have been invited to join the <strong>${data.companyName}</strong> team as <strong>${data.designation}</strong>${data.departmentName ? ` in the <strong>${data.departmentName}</strong> department` : ''}.
              </p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px; color: #475569;">
                  <tr>
                    <td width="35%" style="font-weight: 600; color: #64748b;">Workspace:</td>
                    <td style="font-weight: 600; color: #0f172a;">${data.companyName}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; color: #64748b;">Role / Designation:</td>
                    <td>${data.designation}</td>
                  </tr>
                  ${
                    data.departmentName
                      ? `
                  <tr>
                    <td style="font-weight: 600; color: #64748b;">Department:</td>
                    <td>${data.departmentName}</td>
                  </tr>`
                      : ''
                  }
                  <tr>
                    <td style="font-weight: 600; color: #64748b;">Link Validity:</td>
                    <td style="color: #d97706; font-weight: 600;">${data.expiresInHours} Hours</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.inviteLink}" style="display: inline-block; background-color: #2A65F6; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(42, 101, 246, 0.3);">
                  Accept Invitation &amp; Set Password
                </a>
              </div>

              <p style="margin: 24px 0 0 0; color: #64748b; font-size: 12px; line-height: 18px;">
                If the button above does not work, copy and paste this link into your browser:<br>
                <a href="${data.inviteLink}" style="color: #2A65F6; word-break: break-all;">${data.inviteLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 18px;">
                &copy; ${new Date().getFullYear()} WorkivLab Multi-Tenant SaaS Platform.<br>
                This is an automated invitation generated by your organization administrator.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
        text: `You have been invited to join ${data.companyName} as ${data.designation}. Accept invitation: ${data.inviteLink}`,
      });
      this.logger.log(
        `Employee invitation email sent to ${to}: ${info.messageId}`,
      );
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to send invitation email to ${to}: ${error.message}`,
      );
      return false;
    }
  }

  // Sends official broadcast announcement to employees
  async sendBroadcastEmail(
    to: string,
    data: {
      companyName: string;
      subject: string;
      body: string;
      senderName?: string;
    },
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `Transporter not initialized; skipping broadcast delivery to ${to}`,
      );
      return false;
    }

    const htmlBody = data.body
      .split('\n\n')
      .map(
        (p) =>
          `<p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; line-height: 24px;">${p.replace(/\n/g, '<br>')}</p>`,
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #2A65F6; padding: 28px 40px; text-align: left;">
              <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">
                ${data.companyName}
              </h2>
              <p style="margin: 4px 0 0 0; color: #dbeafe; font-size: 13px;">Official Announcement</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 40px;">
              <h1 style="margin: 0 0 20px 0; color: #0f172a; font-size: 20px; font-weight: 700; line-height: 28px;">
                ${data.subject}
              </h1>

              ${htmlBody}

              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 13px;">
                  Sent by: <strong style="color: #334155;">${data.senderName || data.companyName + ' Leadership'}</strong>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 18px;">
                &copy; ${new Date().getFullYear()} ${data.companyName} &bull; WorkivLab Workspace Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: data.subject,
        html,
        text: data.body,
      });
      this.logger.log(`Broadcast email dispatched to ${to}: ${info.messageId}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Broadcast email error for ${to}: ${err.message}`);
      return false;
    }
  }

  // Sends professional 6-digit password reset OTP email
  async sendPasswordResetOtpEmail(
    to: string,
    data: { name: string; code: string; expiresInMinutes: number },
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `Transporter unavailable; skipping password reset OTP to ${to}. Code: ${data.code}`,
      );
      return false;
    }

    const subject = `${data.code} is your Loondasol password reset OTP`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #012b69; padding: 32px 40px; text-align: center;">
              <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Loonda<span style="color: #3fbafc;">sol</span> Security</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h1 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 700;">
                Password Reset Request
              </h1>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 24px;">
                Hello <strong>${data.name || 'User'}</strong>,<br>
                We received a request to reset your password. Use the verification code below to authorize your password change.
              </p>
              
              <div style="background-color: #eff4fe; border: 2px dashed #2A65F6; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
                <span style="display: block; color: #2A65F6; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                  Your 6-Digit Security OTP
                </span>
                <span style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0f172a; font-family: monospace;">
                  ${data.code}
                </span>
              </div>

              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
                This code expires in <strong>${data.expiresInMinutes} minutes</strong>. If you did not request a password reset, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                WorkivLab Identity & Security Center
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
        text: `Your password reset code is: ${data.code}. It expires in ${data.expiresInMinutes} minutes.`,
      });
      this.logger.log(`Password reset OTP dispatched to ${to}: ${info.messageId}`);
      return true;
    } catch (err: any) {
      this.logger.warn(
        `External SMTP greeting failed (${err.message}). Dispatching via local MailHog fallback...`,
      );
      try {
        const localTransporter = nodemailer.createTransport({
          host: '127.0.0.1',
          port: 1025,
          secure: false,
        });
        const localInfo = await localTransporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          html,
          text: `Your password reset code is: ${data.code}. It expires in ${data.expiresInMinutes} minutes.`,
        });
        this.logger.log(
          `Password reset OTP delivered via MailHog fallback: ${localInfo.messageId} (View at http://localhost:8025)`,
        );
        return true;
      } catch (localErr: any) {
        this.logger.error(`Failed to send password reset OTP to ${to}: ${err.message}`);
        return false;
      }
    }
  }

  // Sends official monthly salary slip notification email with PDF attachment / link
  async sendSalarySlipEmail(
    to: string,
    data: {
      employeeName: string;
      companyName: string;
      month: string;
      currency: string;
      grossEarnings: number;
      totalDeductions: number;
      netSalary: number;
      netPayInWords: string;
      presentDays: number;
      workingDays: number;
      paidLeaveDays: number;
      lopDays: number;
      slipHtmlUrl: string;
      pdfUrl?: string;
      isPasswordProtected?: boolean;
      pdfPasswordHint?: string;
      pdfBuffer?: Buffer;
    },
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `Transporter unavailable; simulated salary slip email to ${to} for ${data.month}`,
      );
      return true;
    }

    const subject = `Salary Slip for ${data.month} — ${data.companyName}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <tr>
            <td style="background-color: #2A65F6; padding: 28px 36px; color: #ffffff;">
              <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.4px;">${data.companyName}</div>
              <div style="font-size: 12px; opacity: 0.85; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.8px;">Official Remuneration Statement • ${data.month}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 36px;">
              <p style="margin: 0 0 18px 0; color: #1e293b; font-size: 15px; line-height: 24px;">
                Hello <strong>${data.employeeName}</strong>,<br>
                Your salary slip for the pay period <strong>${data.month}</strong> has been generated and verified.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 6px 8px; color: #64748b; font-size: 13px;">Attendance Summary:</td>
                  <td style="padding: 6px 8px; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;">${data.presentDays}/${data.workingDays} Present • ${data.paidLeaveDays} Paid Leave • ${data.lopDays} LOP</td>
                </tr>
                <tr>
                  <td style="padding: 6px 8px; color: #64748b; font-size: 13px;">Total Gross Earnings:</td>
                  <td style="padding: 6px 8px; color: #10b981; font-size: 13px; font-weight: 700; text-align: right;">${data.currency} ${data.grossEarnings.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 8px; color: #64748b; font-size: 13px;">Total Deductions:</td>
                  <td style="padding: 6px 8px; color: #ef4444; font-size: 13px; font-weight: 700; text-align: right;">-${data.currency} ${data.totalDeductions.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 8px 6px 8px; color: #0f172a; font-size: 15px; font-weight: 800; border-top: 1px solid #e2e8f0;">Net Take-Home Pay:</td>
                  <td style="padding: 12px 8px 6px 8px; color: #2A65F6; font-size: 18px; font-weight: 800; text-align: right; border-top: 1px solid #e2e8f0;">${data.currency} ${data.netSalary.toLocaleString()}</td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; color: #475569; font-size: 12px; font-style: italic;">
                In Words: <strong>${data.netPayInWords}</strong>
              </p>

              ${
                data.isPasswordProtected
                  ? `<div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px; font-size: 12px; color: #92400e;">
                      <strong>🔒 Password Protected Payslip:</strong> ${data.pdfPasswordHint || 'Use your employee security password to unlock the payslip.'}
                    </div>`
                  : ''
              }

              <div style="text-align: center; margin: 26px 0;">
                <a href="${data.slipHtmlUrl}" style="display: inline-block; background-color: #2A65F6; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 26px; border-radius: 8px; margin-right: 8px;">
                  View Interactive Payslip
                </a>
                ${
                  data.pdfUrl
                    ? `<a href="${data.pdfUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 26px; border-radius: 8px;">
                        Download Cloud PDF
                      </a>`
                    : ''
                }
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 36px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px;">
              Issued by ${data.companyName} via WorkivLab Enterprise Payroll Engine
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: this.fromAddress,
        to,
        subject,
        html,
        text: `Hello ${data.employeeName}, your salary slip for ${data.month} is ready. Net Pay: ${data.currency} ${data.netSalary.toLocaleString()} (${data.netPayInWords}). View at: ${data.slipHtmlUrl}`,
      };

      if (data.pdfBuffer) {
        mailOptions.attachments = [
          {
            filename: `Payslip_${data.employeeName.replace(/\s+/g, '_')}_${data.month}.pdf`,
            content: data.pdfBuffer,
            contentType: 'application/pdf',
          },
        ];
      }

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Salary slip email dispatched to ${to}: ${info.messageId}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send salary slip email to ${to}: ${err.message}`);
      return false;
    }
  }
}
