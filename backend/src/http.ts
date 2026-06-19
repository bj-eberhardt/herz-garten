import type { Response } from 'express';

export function sendJson<T>(response: Response, payload: T) {
  response.json(payload);
}
