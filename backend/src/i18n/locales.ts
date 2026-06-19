export function normalizeLocale(value: unknown) {
  if (typeof value !== 'string') return '';
  const locale = value.trim().toLowerCase().split(';')[0]?.split(',')[0]?.replace('_', '-') ?? '';
  return locale.split('-')[0] ?? '';
}

export function parseAcceptLanguage(headerValue: string | undefined) {
  if (!headerValue) return '';
  const candidates = headerValue
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { locale: normalizeLocale(tag), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((candidate) => candidate.locale)
    .sort((left, right) => right.q - left.q);

  return candidates[0]?.locale ?? '';
}
