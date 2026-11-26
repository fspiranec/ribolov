/** Tiny in-process TTL cache. Good enough for a single Next.js server. */
export class TtlCache<T> {
  private m = new Map<string, { v: T; exp: number }>();
  constructor(private ttlMs: number, private max = 5000) {}

  get(k: string): T | undefined {
    const e = this.m.get(k);
    if (!e) return undefined;
    if (e.exp < Date.now()) {
      this.m.delete(k);
      return undefined;
    }
    return e.v;
  }

  set(k: string, v: T): void {
    if (this.m.size >= this.max) this.m.delete(this.m.keys().next().value as string);
    this.m.set(k, { v, exp: Date.now() + this.ttlMs });
  }
}

/** Rounds a coordinate to a 0.05° grid (cache key for weather). */
export function grid(v: number, step = 0.05): string {
  return (Math.round(v / step) * step).toFixed(2);
}
