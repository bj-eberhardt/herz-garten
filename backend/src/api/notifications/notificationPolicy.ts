export type PushNotificationMode = 'all' | 'actions_only';

const actionNotificationTypes = new Set([
  'daily_answer_waiting',
  'quest_waiting_confirmation',
  'know_me_question',
  'love_jar_note',
  'couple_joined',
  'admin_password_reset',
]);

export function normalizePushNotificationMode(value: unknown): PushNotificationMode {
  return value === 'actions_only' ? 'actions_only' : 'all';
}

export function notificationNeedsAction(type: string) {
  return actionNotificationTypes.has(type);
}

export function shouldSendPushForMode(mode: PushNotificationMode, notificationType: string) {
  return mode === 'all' || notificationNeedsAction(notificationType);
}
