import { ApiError } from '@/services/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ADMIN_TOKEN_KEY = 'herzgarten_admin_token';

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminApiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', `${navigator.language || 'de'}, de;q=0.9, en;q=0.8`);
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
    const errorKey = typeof payload?.errorKey === 'string' ? payload.errorKey : undefined;
    throw new ApiError(errorKey ?? serverMessage ?? 'api.requestFailed', response.status, errorKey, undefined, serverMessage);
  }

  return payload as T;
}

export function adminDownloadUrl(path: string) {
  return `${API_URL}${path}`;
}
