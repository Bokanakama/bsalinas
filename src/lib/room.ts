import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GameState } from "./game";
import type { Json } from "@/integrations/supabase/types";

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

// Saves are chained so an older state can never land after a newer one; bursts collapse to the latest.
let saving: Promise<void> = Promise.resolve();
const latest = new Map<string, GameState>();
export function saveState(code: string, state: GameState) {
  const first = !latest.has(code);
  latest.set(code, state);
  if (!first) return saving;
  saving = saving.then(async () => {
    const s = latest.get(code)!;
    latest.delete(code);
    const { error } = await supabase.from("rooms").update({ state: s as unknown as Json, updated_at: new Date().toISOString() }).eq("code", code);
    if (error) console.error("Falha ao salvar a sala", error.message);
  });
  return saving;
}
/** Master: push state to phones right away, then persist. */
export function publishState(code: string, state: GameState) {
  broadcast(code, "room_state", { state, at: new Date().toISOString() });
  return saveState(code, state);
}


/** One shared broadcast room per game: phones send actions, the master sends state, straight over the socket. */
type Ch = ReturnType<typeof supabase.channel>;
const rooms = new Map<string, { ch: Ch; refs: number; ready: boolean }>();
export function joinRoomChannel(code: string) {
  let r = rooms.get(code);
  if (!r) {
    const ch = supabase.channel(`room:${code}`, { config: { broadcast: { self: false } } });
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
  // Instant path; the database insert below (same id) is the reliable fallback and the master dedupes.
  broadcast(code, "player_action", { id, room_code: code, player_id: playerId, type, payload, created_at: "" });
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase.from("actions").insert({ id, room_code: code, player_id: playerId, type, payload: payload as Json });
    if (!error) return true;
    console.error("Falha ao enviar ação", type, error.message);
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  return false;
}

/** Live room state for player phones. Realtime plus a polling safety net, so a dropped connection never freezes a phone. */
export function useRoomState(code: string) {
  const [state, setState] = useState<GameState | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true;
    let stamp = ""; // updated_at of the newest state applied
    let live = false, tick = 0;
    const apply = (s: GameState, at: string) => {
      if (!alive || (stamp && at && at < stamp)) return;
      if (at) stamp = at;
      setState(s);
    };
    const refetch = async () => {
      const { data, error } = await supabase.from("rooms").select("state, updated_at").eq("code", code).maybeSingle();
      if (!alive) return;
      if (error) return console.error("Falha ao carregar a sala", error.message);
      if (!data) return setMissing(true);
      if (data.updated_at !== stamp) apply(data.state as unknown as GameState, data.updated_at);
    };
    void refetch();
    const room = joinRoomChannel(code);
    room.ch.on("broadcast", { event: "room_state" }, ({ payload }) => {
      const m = payload as { state: GameState; at: string };
      if (m?.state) apply(m.state, m.at);
    });
    room.subscribe();
    const ch = supabase
      .channel(`room-${code}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` }, (p) => {
        const row = p.new as { state: GameState; updated_at: string };
        apply(row.state, row.updated_at);
      })
      .subscribe((status) => { live = status === "SUBSCRIBED"; if (live) void refetch(); });
    // Poll fast only while realtime is down; otherwise a light check every 10s, skipped in background tabs.
    const poll = setInterval(() => { tick++; if (document.visibilityState === "visible" && (!live || tick % 4 === 0)) void refetch(); }, 2500);
    const wake = () => { if (document.visibilityState === "visible") void refetch(); };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    window.addEventListener("focus", wake);
    return () => {
      alive = false;
      clearInterval(poll);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
      window.removeEventListener("focus", wake);
      supabase.removeChannel(ch);
      room.leave();
    };
  }, [code]);
  return { state, missing };
}
