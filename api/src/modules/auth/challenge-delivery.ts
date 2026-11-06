import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}
  assertAvailable() {
    if (this.config.get('NODE_ENV') === 'production')
      throw new ServiceUnavailableException({
        code: 'CHALLENGE_DELIVERY_UNAVAILABLE',
        message: 'Email delivery is not configured',
      });
  }
  async send(message: ChallengeMessage) {
    this.assertAvailable();
    this.messages.push(message);
    if (this.messages.length > 100) this.messages.shift();
  }
  takeForLocalTesting() {
    return this.messages
      .splice(0)
      .filter((message) => message.expiresAt > new Date());
  }
}
