/** Repair polling never replaces realtime; disconnected clients retain the fast fallback. */
export const roomPollMs = (live: boolean) => live ? 6000 : 1500;

/** Keep one trailing read when a doorbell arrives during an older request. */
export function createRefreshQueue(read: () => Promise<void>) {
  let running: Promise<void> | undefined;
  let dirty = false;
  let stopped = false;
  return {
    refresh() {
      if (stopped) return Promise.resolve();
      dirty = true;
      if (running) return running;
      running = (async () => {
        while (dirty && !stopped) {
          dirty = false;
          try { await read(); } catch { /* Next doorbell or repair poll retries. */ }
        }
      })().finally(() => { running = undefined; });
      return running;
    },
    stop() { stopped = true; dirty = false; },
  };
}

/** Independent per-room writers coalesce bursts, but retain a failed dirty snapshot. */
export function createStateWriter<T>(write: (code: string, state: T) => Promise<void>, wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
  const rooms = new Map<string, { latest?: T; running?: Promise<void> }>();
  return (code: string, state: T) => {
    const entry = rooms.get(code) ?? {};
    rooms.set(code, entry);
    entry.latest = state;
    if (entry.running) return entry.running;
    entry.running = (async () => {
      let failures = 0;
      while (entry.latest !== undefined) {
        const snapshot = entry.latest;
        try {
          await write(code, snapshot);
          if (entry.latest === snapshot) delete entry.latest;
          failures = 0;
        } catch (error) {
          if (++failures >= 3) throw error;
          await wait(300 * 2 ** (failures - 1));
        }
      }
    })().finally(() => {
      delete entry.running;
      if (entry.latest === undefined) rooms.delete(code);
    });
    return entry.running;
  };
}