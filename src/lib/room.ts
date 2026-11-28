import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { newState, type CityId, type GameState } from "./game";
import { roomRequest } from "./room.functions";
import { createRefreshQueue, createStateWriter, roomPollMs } from "./room-sync";

export function makeCode() {
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () => L[Math.floor(Math.random() * L.length)]).join("");
}

export function getPlayerId() {
  let id = localStorage.getItem("boro-pid");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("boro-pid", id);
  }
  return id;
}

/** Reconnect: take over a seat that was played from another tab or browser. */
export function setPlayerId(id: string) {
  localStorage.setItem("boro-pid", id);
}

// Credentials are issued by the server and scoped to one room and role.
const channels = new Map<string, string>();
export type RoomSnapshot = { channel: string; state: GameState; updated_at: string };
const pendingAccess = new Map<string, Promise<RoomSnapshot | null>>();
export async function openRoom(code: string, master = false): Promise<RoomSnapshot | null> {
  const key = `boro-access-${code}-${master ? "master" : "player"}`;
  const pending = pendingAccess.get(key);
  if (pending) return pending;
  const task = (async () => {
    let token = localStorage.getItem(key);
    if (!token && master) return null;
    if (!token) {
      const response = await roomRequest({ data: { op: "join", code } });
      if (!response.token) return null;
      token = response.token;
      localStorage.setItem(key, token);
    }
    const response = await roomRequest({ data: { op: "read", code, token } });
    const row = response.result as RoomSnapshot | null;
    if (!row?.channel) return null;
    channels.set(code, row.channel);
    return row;
  })().catch(() => null).finally(() => pendingAccess.delete(key));
  pendingAccess.set(key, task);
  return task;
}
export async function ensureRoomAccess(code: string, master = false) {
  return !!await openRoom(code, master);
}
export async function createRoom(code: string, city: CityId = "salinas") {
  const response = await roomRequest({ data: { op: "create", code } });
  if (!response.token) throw new Error("Não deu para criar a sala.");
  localStorage.setItem(`boro-access-${code}-master`, response.token);
  if (city !== "salinas") await accessRoom(code, "write", { state: newState(city) }, true);
}
export async function accessRoom(code: string, op: "read" | "write" | "actions" | "send" | "prune", payload: Record<string, unknown> = {}, master = false) {
  const token = localStorage.getItem(`boro-access-${code}-${master ? "master" : "player"}`);
  if (!token) throw new Error("Acesso à sala não autorizado.");
  return (await roomRequest({ data: { op, code, token, payload } })).result;
}

export const saveState = createStateWriter<GameState>(async (code, state) => {
  await accessRoom(code, "write", { state }, true);
  broadcast(code, "room_state", {});
});
export function publishState(code: string, state: GameState) {
  return saveState(code, state);
}

// Broadcasts are doorbells only: always fetch authorized data before applying it.
type Ch = ReturnType<typeof supabase.channel>;
const rooms = new Map<string, { ch: Ch; refs: number; ready: boolean }>();
export function joinRoomChannel(code: string) {
  const channel = channels.get(code);
  if (!channel) throw new Error("Acesso à sala não autorizado.");
  let r = rooms.get(code);
  if (!r) {
    const ch = supabase.channel(`room:${channel}`, { config: { broadcast: { self: false } } });
    r = { ch, refs: 0, ready: false };
    rooms.set(code, r);
  }
  r.refs++;
  const entry = r;
  return {
    ch: entry.ch,
    subscribe(cb?: (live: boolean) => void) {
      entry.ch.subscribe((st) => { entry.ready = st === "SUBSCRIBED"; cb?.(entry.ready); });
    },
    leave() { if (--entry.refs <= 0) { rooms.delete(code); void supabase.removeChannel(entry.ch); } },
  };
}
export function broadcast(code: string, event: string, payload: Record<string, unknown>) {
  const r = rooms.get(code);
  if (r?.ready) void r.ch.send({ type: "broadcast", event, payload }).catch(() => {});
}

export async function sendAction(code: string, playerId: string, type: string, payload: Record<string, unknown> = {}) {
  const id = crypto.randomUUID();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await accessRoom(code, "send", { id, player_id: playerId, type, payload });
      broadcast(code, "player_action", {});
      return true;
    } catch { await new Promise((r) => setTimeout(r, 400 * (attempt + 1))); }
  }
  return false;
}

/** Live state is always read through the credential-checked gateway. */
export function useRoomState(code: string) {
  const [state, setState] = useState<GameState | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true, live = false, lastRead = 0;
    let stamp = "";
    let room: ReturnType<typeof joinRoomChannel> | undefined;
    setState(null); setMissing(false);
    const apply = (data: RoomSnapshot | null) => {
      if (!alive) return;
      if (!data) { setMissing(true); return; }
      if (data.updated_at > stamp) { stamp = data.updated_at; setMissing(false); setState(data.state); }
    };
    const reads = createRefreshQueue(async () => {
      if (!alive) return;
      apply(await accessRoom(code, "read") as RoomSnapshot | null);
      lastRead = Date.now();
    });
    void (async () => {
      const initial = await openRoom(code);
      if (!initial) { if (alive) setMissing(true); return; }
      if (!alive) return;
      apply(initial); lastRead = Date.now();
      room = joinRoomChannel(code);
      room.ch.on("broadcast", { event: "room_state" }, () => void reads.refresh());
      let subscribed = false;
      room.subscribe((connected) => {
        live = connected;
        if (connected && (subscribed || Date.now() - lastRead > 10000)) void reads.refresh();
        if (connected) subscribed = true;
      });
    })();
    const poll = setInterval(() => { if (document.visibilityState === "visible" && room && Date.now() - lastRead >= roomPollMs(live)) void reads.refresh(); }, 1500);
    const wake = () => { if (document.visibilityState === "visible" && room) void reads.refresh(); };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    window.addEventListener("focus", wake);
    return () => {
      alive = false;
      reads.stop();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
      window.removeEventListener("focus", wake);
      room?.leave();
    };
  }, [code]);
  return { state, missing };
}
