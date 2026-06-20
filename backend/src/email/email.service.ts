import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config.js';
import { pool } from '../db.js';
import { loadEmailSettings, type AdminSettingsPayload } from '../admin/settings.service.js';
import { renderTemplate } from '../api/notifications/messages.js';

export type EmailSettings = AdminSettingsPayload['email'];

interface MailInput {
  to: string;
  subject: string;
  text: string;
}

interface TemplateRow {
  text: string | null;
}

let transporter: Transporter | null = null;
let transporterKey = '';

function transportKey(settings: EmailSettings) {
  return JSON.stringify({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    user: settings.smtpUser,
    passwordConfigured: Boolean(settings.smtpPassword),
  });
}

function mailFrom(settings: EmailSettings) {
  if (!settings.fromName) return settings.fromAddress;
  return `"${settings.fromName.replace(/"/g, '\\"')}" <${settings.fromAddress}>`;
}

function getTransporter(settings: EmailSettings) {
  const key = transportKey(settings);
  if (transporter && transporterKey === key) return transporter;

  transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: settings.smtpUser
      ? {
          user: settings.smtpUser,
          pass: settings.smtpPassword ?? '',
        }
      : undefined,
  });
  transporterKey = key;
  return transporter;
}

export async function resolveEmailSettings() {
  return loadEmailSettings();
}

export function emailSettingsAvailable(settings: EmailSettings) {
  return Boolean(settings.enabled && settings.smtpHost && settings.fromAddress);
}

export async function isEmailAvailable() {
  return emailSettingsAvailable(await resolveEmailSettings());
}

export async function sendMail(input: MailInput) {
  const settings = await resolveEmailSettings();
  if (!emailSettingsAvailable(settings)) {
    console.warn('[email] skipped: email is disabled or SMTP settings are incomplete');
    return { sent: false as const, reason: 'not_configured' as const };
  }

  await getTransporter(settings).sendMail({
    to: input.to,
    from: mailFrom(settings),
    replyTo: settings.replyTo || undefined,
    subject: input.subject,
    text: input.text,
  });
  return { sent: true as const };
}

export async function renderEmailTemplate(
  key: string,
  params: Record<string, unknown> = {},
  locale = config.i18nDefaultLocale,
) {
  const result = await pool.query<TemplateRow>(
    `
      select coalesce(requested.text, fallback.text) as text
      from message_templates template
      left join message_template_translations requested
        on requested.template_key = template.key and requested.locale = $2
      left join message_template_translations fallback
        on fallback.template_key = template.key and fallback.locale = $3
      where template.key = $1 and template.namespace = 'email' and template.active = true
      limit 1
    `,
    [key, locale, config.i18nDefaultLocale],
  );
  const template = result.rows[0]?.text ?? key;
  return renderTemplate(template, params);
}
