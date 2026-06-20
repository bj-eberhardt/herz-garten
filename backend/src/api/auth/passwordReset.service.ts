import bcrypt from 'bcryptjs';
import { createHmac, randomBytes } from 'node:crypto';
import { config } from '../../config.js';
import { loadPasswordResetSettings, loadServerSettings } from '../../admin/settings.service.js';
import { emailSettingsAvailable, renderEmailTemplate, resolveEmailSettings, sendMail } from '../../email/email.service.js';
import {
  applyPasswordReset,
  countRecentPasswordResetRequests,
  createPasswordResetToken,
  findPasswordResetUserByEmail,
  findValidPasswordResetToken,
  insertPasswordResetRequest,
} from './passwordReset.repository.js';

export const neutralPasswordResetResponse = { ok: true } as const;

function hmac(value: string) {
  return createHmac('sha256', config.jwtSecret).update(value).digest('hex');
}

function resetToken() {
  return randomBytes(32).toString('base64url');
}

export function hashPasswordResetToken(token: string) {
  return hmac(`password-reset-token:${token}`);
}

export function hashPasswordResetEmail(email: string) {
  return hmac(`password-reset-email:${email}`);
}

function resetUrl(baseUrl: string, token: string) {
  const url = new URL('/reset-password', baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

export async function requestPasswordReset(email: string, locale = config.i18nDefaultLocale) {
  const emailHash = hashPasswordResetEmail(email);
  const passwordResetSettings = await loadPasswordResetSettings();
  const recentRequests = await countRecentPasswordResetRequests(emailHash);
  if (recentRequests >= passwordResetSettings.limitPer24h) {
    return { status: 'limited' as const };
  }

  await insertPasswordResetRequest(emailHash);

  const settings = await resolveEmailSettings();
  if (!emailSettingsAvailable(settings)) {
    console.warn('[auth] password reset requested while email is unavailable');
    return { status: 'ok' as const };
  }

  const user = await findPasswordResetUserByEmail(email);
  if (!user) {
    return { status: 'ok' as const };
  }

  const token = resetToken();
  const ttlMinutes = passwordResetSettings.ttlMinutes;
  const serverSettings = await loadServerSettings();
  const url = resetUrl(serverSettings.publicBaseUrl, token);
  await createPasswordResetToken(user.id, hashPasswordResetToken(token), ttlMinutes);

  try {
    await sendMail({
      to: user.email,
      subject: await renderEmailTemplate('emails.passwordReset.subject', {}, locale),
      text: await renderEmailTemplate(
        'emails.passwordReset.body',
        {
          displayName: user.displayName,
          resetUrl: url,
          expiresInMinutes: ttlMinutes,
        },
        locale,
      ),
    });
  } catch (error) {
    console.error('[auth] password reset email delivery failed', error);
  }

  return { status: 'ok' as const };
}

export async function resetPassword(token: string, password: string) {
  const tokenRow = await findValidPasswordResetToken(hashPasswordResetToken(token));
  if (!tokenRow) return { status: 'invalid' as const };

  const passwordHash = await bcrypt.hash(password, 12);
  const applied = await applyPasswordReset(tokenRow.id, tokenRow.userId, passwordHash);
  return applied ? { status: 'ok' as const } : { status: 'invalid' as const };
}
