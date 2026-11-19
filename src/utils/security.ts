// Client-Side Security Hardening Utilities:
// Input Sanitization (XSS prevention), CSRF Token Management, and Rate Limiting.

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

export function sanitizeInput(raw: string): string {
  if (!raw) return '';
  const stripped = raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  return stripped.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char).trim();
}

export function sanitizeNumericInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function generateCsrfToken(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i += 1) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function validateCsrfToken(sessionToken: string, submittedToken: string): boolean {
  if (!sessionToken || !submittedToken || sessionToken.length !== submittedToken.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < sessionToken.length; i += 1) {
    diff |= sessionToken.charCodeAt(i) ^ submittedToken.charCodeAt(i);
  }
  return diff === 0;
}

export class ActionRateLimiter {
  private timestamps: Map<string, number[]> = new Map();
  private readonly maxActions: number;
  private readonly windowMs: number;

  constructor(maxActions = 4, windowMs = 5000) {
    this.maxActions = maxActions;
    this.windowMs = windowMs;
  }

  public attempt(actionKey: string): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    const history = (this.timestamps.get(actionKey) ?? []).filter(
      (ts) => now - ts < this.windowMs
    );
    if (history.length >= this.maxActions) {
      const oldest = history[0] ?? now;
      const retryAfterSec = Math.max(1, Math.ceil((this.windowMs - (now - oldest)) / 1000));
      this.timestamps.set(actionKey, history);
      return { allowed: false, retryAfterSec };
    }
    history.push(now);
    this.timestamps.set(actionKey, history);
    return { allowed: true, retryAfterSec: 0 };
  }
}

export const bidRateLimiter = new ActionRateLimiter(4, 5000);
export const financialRateLimiter = new ActionRateLimiter(3, 8000);

export function safeStorageGet<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeStorageSet<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or private-mode errors gracefully
  }
}
