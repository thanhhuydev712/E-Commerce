import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
export type ChallengeMessage = {
  email: string;
  token: string;
  purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD';
  expiresAt: Date;
};
@Injectable()
export class ChallengeDelivery {
  // Local-only, bounded and ephemeral. No HTTP endpoint or logs expose these messages.
  private readonly messages: ChallengeMessage[] = [];
  private transport?: Transporter;
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}
  private get mode() {
    return (
      this.config.get<string>('CHALLENGE_DELIVERY') ??
      (this.config.get('NODE_ENV') === 'production' ? 'disabled' : 'memory')
    );
  }
  assertAvailable(purpose: ChallengeMessage['purpose'] = 'RESET_PASSWORD') {
    const recoveryPreview =
      this.config.get('PREVIEW_READ_ONLY') === true &&
      this.config.get('INTERACTIVE_DEMO') === true &&
      this.config.get('PASSWORD_RECOVERY_ENABLED') === true &&
      this.mode === 'smtp' &&
      purpose === 'RESET_PASSWORD';
    if (
      (this.config.get('PREVIEW_READ_ONLY') === true && !recoveryPreview) ||
      this.mode === 'disabled' ||
      (this.mode === 'memory' && this.config.get('NODE_ENV') === 'production')
    )
      throw new ServiceUnavailableException({
        code: 'CHALLENGE_DELIVERY_UNAVAILABLE',
        message: 'Email delivery is not configured',
      });
  }
  async send(message: ChallengeMessage) {
    this.assertAvailable(message.purpose);
    if (
      this.config.get('PASSWORD_RECOVERY_ENABLED') === true &&
      !this.config
        .getOrThrow<string>('PASSWORD_RECOVERY_ALLOWED_EMAILS')
        .split(',')
        .includes(message.email)
    )
      throw new ServiceUnavailableException(
        'Recovery recipient is not allowed',
      );
    if (this.mode === 'memory') {
      this.messages.push(message);
      if (this.messages.length > 100) this.messages.shift();
      return;
    }
    this.transport ??= nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.getOrThrow<number>('SMTP_PORT'),
      secure: this.config.getOrThrow<boolean>('SMTP_SECURE'),
      // Port 587 upgrades with STARTTLS; never send credentials over plaintext.
      requireTLS: true,
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
      },
      tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      disableFileAccess: true,
      disableUrlAccess: true,
      logger: false,
      debug: false,
    });
    const reset = message.purpose === 'RESET_PASSWORD';
    const url = new URL(
      reset ? '/reset-password' : '/verify-email',
      this.config.getOrThrow<string>('STOREFRONT_URL'),
    );
    url.hash = new URLSearchParams({ token: message.token }).toString();
    const result = await this.transport.sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to: { address: message.email, name: '' },
      subject: reset
        ? 'Rigforge - Đặt lại mật khẩu'
        : 'Rigforge - Xác minh email',
      text: [
        reset
          ? 'Bạn đã yêu cầu đặt lại mật khẩu Rigforge.'
          : 'Xác minh email Rigforge của bạn.',
        'Mở liên kết bên dưới. Liên kết chỉ dùng một lần và hết hạn sau 30 phút.',
        url.toString(),
        'Nếu bạn không yêu cầu, hãy bỏ qua email này.',
      ].join('\n\n'),
    });
    if (!result.accepted?.length || result.rejected?.length)
      throw new Error('Challenge email was not accepted');
  }
  takeForLocalTesting() {
    return this.messages
      .splice(0)
      .filter((message) => message.expiresAt > new Date());
  }
}
