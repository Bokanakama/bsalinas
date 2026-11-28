import { RITUAL_TUNING_MS } from "./esquecidos";

/** Local presentation challenge; financial authorization remains on the master. */
export function ritualNeedle(elapsed: number): number {
  return Math.max(0, Math.min(100, elapsed / RITUAL_TUNING_MS * 100));
}
export function ritualAligned(elapsed: number): boolean {
  return Number.isFinite(elapsed) && elapsed >= 1050 && elapsed <= 1950;
}