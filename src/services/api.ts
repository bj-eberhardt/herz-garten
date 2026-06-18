import { i18n } from '@/i18n';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export const SESSION_EXPIRED_MESSAGE_KEY = 'herzgarten_session_expired_message';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errorKey?: string,
    public readonly params?: Record<string, unknown>,
    public readonly serverMessage?: string,
  ) {
    super(message);
  }
}

export function getToken() {
  return localStorage.getItem('herzgarten_token');
}

export function setToken(token: string) {
  localStorage.setItem('herzgarten_token', token);
}

export function clearToken() {
  localStorage.removeItem('herzgarten_token');
}

function handleExpiredSession(errorKey?: string) {
  if (errorKey !== 'auth.invalidToken' && errorKey !== 'auth.missingToken') return;
  if (!getToken()) return;

  clearToken();
  sessionStorage.setItem(SESSION_EXPIRED_MESSAGE_KEY, '1');
  window.dispatchEvent(new CustomEvent('herzgarten:session-expired'));
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Accept-Language')) {
    const localeState = i18n.global.locale as unknown as { value?: string } | string;
    const locale = typeof localeState === 'string' ? localeState : (localeState.value ?? 'de');
    headers.set('Accept-Language', `${locale}, de;q=0.9`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });
  const contentType = response.headers.get('content-type');
  const payload = contentType?.includes('application/json') ? await response.json() : undefined;

  if (!response.ok) {
    const serverMessage = typeof payload?.error === 'string' ? payload.error : undefined;
    const errorKey =
      typeof payload?.errorCode === 'string'
        ? payload.errorCode
        : typeof payload?.errorKey === 'string'
          ? payload.errorKey
          : undefined;
    const params = payload?.params && typeof payload.params === 'object' ? payload.params : undefined;
    if (response.status === 401) handleExpiredSession(errorKey);
    throw new ApiError(errorKey ?? serverMessage ?? 'api.requestFailed', response.status, errorKey, params, serverMessage);
  }

  return payload as T;
}
