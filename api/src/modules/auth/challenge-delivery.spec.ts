import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ChallengeDelivery,
  type ChallengeMessage,
} from './challenge-delivery.js';

const smtp = vi.hoisted(() => ({
  sendMail: vi.fn(),
  createTransport: vi.fn(),
}));
vi.mock('nodemailer', () => ({
  default: { createTransport: smtp.createTransport },
}));
const message: ChallengeMessage = {
  email: 'customer@example.test',
  token: 'test-token-with-no-real-credential',
  purpose: 'RESET_PASSWORD',
  expiresAt: new Date(Date.now() + 30 * 60_000),
};
const settings = {
  NODE_ENV: 'production',
  CHALLENGE_DELIVERY: 'smtp',
  SMTP_HOST: 'smtp.example.test',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_USER: 'fixture',
  SMTP_PASSWORD: 'fixture-only',
  SMTP_FROM: 'noreply@example.test',
  STOREFRONT_URL: 'https://shop.example.test',
};
describe('Challenge email delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    smtp.createTransport.mockReturnValue({ sendMail: smtp.sendMail });
    smtp.sendMail.mockResolvedValue({
      accepted: [message.email],
      rejected: [],
    });
  });
  it('requires TLS, disables content fetching and puts the reset token only in a fragment', async () => {
    const delivery = new ChallengeDelivery(new ConfigService(settings));
    await delivery.send(message);
    expect(smtp.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        requireTLS: true,
        secure: false,
        tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
        disableFileAccess: true,
        disableUrlAccess: true,
        logger: false,
        debug: false,
      }),
    );
    const sent = smtp.sendMail.mock.calls[0][0];
    expect(sent.to).toEqual({ address: message.email, name: '' });
    const link = new URL(sent.text.split('\n\n')[2]);
    expect(link.origin).toBe(settings.STOREFRONT_URL);
    expect(link.pathname).toBe('/reset-password');
    expect(link.search).toBe('');
    expect(new URLSearchParams(link.hash.slice(1)).get('token')).toBe(
      message.token,
    );
    expect(delivery.takeForLocalTesting()).toEqual([]);
  });
  it('uses a separate verification link and reuses the transport', async () => {
    const delivery = new ChallengeDelivery(new ConfigService(settings));
    await delivery.send({ ...message, purpose: 'VERIFY_EMAIL' });
    await delivery.send(message);
    expect(smtp.sendMail.mock.calls[0][0].text).toContain(
      '/verify-email#token=',
    );
    expect(smtp.createTransport).toHaveBeenCalledTimes(1);
  });
  it('reports rejected recipients and transport failures to the caller without local capture', async () => {
    const delivery = new ChallengeDelivery(new ConfigService(settings));
    smtp.sendMail.mockResolvedValueOnce({
      accepted: [],
      rejected: [message.email],
    });
    await expect(delivery.send(message)).rejects.toThrow('not accepted');
    smtp.sendMail.mockRejectedValueOnce(new Error('smtp failure'));
    await expect(delivery.send(message)).rejects.toThrow('smtp failure');
    expect(delivery.takeForLocalTesting()).toEqual([]);
  });
  it('blocks production memory, missing production configuration and preview delivery', async () => {
    for (const config of [
      { NODE_ENV: 'production' },
      { NODE_ENV: 'production', CHALLENGE_DELIVERY: 'memory' },
      { ...settings, PREVIEW_READ_ONLY: true },
    ]) {
      await expect(
        new ChallengeDelivery(new ConfigService(config)).send(message),
      ).rejects.toThrow();
    }
    expect(smtp.createTransport).not.toHaveBeenCalled();
  });
  it('keeps local capture bounded and excludes expired messages', async () => {
    const delivery = new ChallengeDelivery(
      new ConfigService({ NODE_ENV: 'test' }),
    );
    for (let index = 0; index < 101; index++) await delivery.send(message);
    expect(delivery.takeForLocalTesting()).toHaveLength(100);
    await delivery.send({ ...message, expiresAt: new Date(0) });
    expect(delivery.takeForLocalTesting()).toEqual([]);
    expect(smtp.createTransport).not.toHaveBeenCalled();
  });
});
