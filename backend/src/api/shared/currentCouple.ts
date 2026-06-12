import type { Response } from 'express';
import { sendApiError } from '../../errors.js';
import { getCurrentCouple } from '../support.js';

export async function requireCurrentCoupleForUser(response: Response, userId: string) {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    sendApiError(response, 409, 'couple.notConnected');
    return null;
  }

  return couple;
}
