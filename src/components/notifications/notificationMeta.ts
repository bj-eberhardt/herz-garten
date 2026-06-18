import type { Component } from 'vue';
import {
  CheckCircle2,
  ClipboardCheck,
  Gamepad2,
  HeartHandshake,
  HelpCircle,
  Info,
  Lamp,
  MessageCircleQuestion,
  Sprout,
  Trash2,
} from '@lucide/vue';
import type { NotificationItem, NotificationType } from '@/types/domain';

export interface NotificationMeta {
  featureKey: string;
  actionKey: string;
  tone: 'action' | 'info' | 'warning';
  icon: Component;
  needsAction: boolean;
}

const actionTypes = new Set<NotificationType>([
  'daily_answer_waiting',
  'quest_waiting_confirmation',
  'know_me_question',
  'love_jar_note',
  'couple_joined',
]);

const notificationMetaByType: Record<NotificationType, NotificationMeta> = {
  daily_answer_waiting: {
    featureKey: 'notifications.features.today',
    actionKey: 'notifications.actions.answer',
    tone: 'action',
    icon: MessageCircleQuestion,
    needsAction: true,
  },
  daily_revealed: {
    featureKey: 'notifications.features.today',
    actionKey: 'notifications.actions.viewGarden',
    tone: 'info',
    icon: Sprout,
    needsAction: false,
  },
  quest_waiting_confirmation: {
    featureKey: 'notifications.features.quest',
    actionKey: 'notifications.actions.checkQuest',
    tone: 'action',
    icon: ClipboardCheck,
    needsAction: true,
  },
  quest_completed: {
    featureKey: 'notifications.features.quest',
    actionKey: 'notifications.actions.viewGarden',
    tone: 'info',
    icon: CheckCircle2,
    needsAction: false,
  },
  love_jar_note: {
    featureKey: 'notifications.features.loveJar',
    actionKey: 'notifications.actions.viewNote',
    tone: 'action',
    icon: Lamp,
    needsAction: true,
  },
  memory_created: {
    featureKey: 'notifications.features.memory',
    actionKey: 'notifications.actions.viewMemory',
    tone: 'info',
    icon: HeartHandshake,
    needsAction: false,
  },
  know_me_question: {
    featureKey: 'notifications.features.knowMe',
    actionKey: 'notifications.actions.answerQuestion',
    tone: 'action',
    icon: HelpCircle,
    needsAction: true,
  },
  know_me_answered: {
    featureKey: 'notifications.features.knowMe',
    actionKey: 'notifications.actions.viewGame',
    tone: 'info',
    icon: Gamepad2,
    needsAction: false,
  },
  couple_disconnected: {
    featureKey: 'notifications.features.account',
    actionKey: 'notifications.actions.reconnect',
    tone: 'warning',
    icon: Trash2,
    needsAction: false,
  },
  couple_joined: {
    featureKey: 'notifications.features.garden',
    actionKey: 'notifications.actions.viewGarden',
    tone: 'action',
    icon: HeartHandshake,
    needsAction: true,
  },
};

const fallbackMeta: NotificationMeta = {
  featureKey: 'notifications.features.garden',
  actionKey: 'notifications.actions.open',
  tone: 'info',
  icon: Info,
  needsAction: false,
};

export function notificationMeta(notification: NotificationItem): NotificationMeta {
  return notificationMetaByType[notification.type] ?? {
    ...fallbackMeta,
    needsAction: actionTypes.has(notification.type),
    tone: actionTypes.has(notification.type) ? 'action' : 'info',
  };
}
