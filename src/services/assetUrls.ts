const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function resolveAssetUrl(path: string) {
  if (!path || !path.startsWith('/uploads/')) return path;
  return `${API_URL}${path}`;
}
