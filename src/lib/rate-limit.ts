/**
 * Limitador de tentativas simples, em memoria, para mitigar forca bruta
 * no login (secao 35 do briefing). Ancorado em globalThis pelo mesmo
 * motivo do barramento de tempo real (src/lib/realtime.ts): sobrevive ao
 * Fast Refresh do Next em dev e fica visivel entre as "layers" de
 * compilacao. Funciona para um deploy de instancia unica; varias
 * instancias precisariam de um armazenamento compartilhado (Redis, etc.).
 */
type Bucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as { rateLimitBuckets?: Map<string, Bucket> };
const buckets = globalForRateLimit.rateLimitBuckets ?? new Map<string, Bucket>();
if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.rateLimitBuckets = buckets;
}

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (bucket.count >= maxAttempts) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, remaining: maxAttempts - bucket.count };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
