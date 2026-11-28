import * as G from "./game";

/** Presentation only: never changes the master's shared state. */
export function horrorFeedback(state: G.GameState, playerId: string) {
  const me = state.players.find((p) => p.id === playerId);
  const c = state.curse;
  if (!G.horrorActive(state) || !c || !me || me.out) return { active: false, distance: 56, lowSanity: false, lost: false, heartbeatMs: 0 };
  const delta = Math.abs(me.pos - (c.ghost ?? 28));
  const distance = Math.min(delta, G.boardFor(state).length - delta);
  const sanity = c.sanity[playerId] ?? 0;
  return { active: true, distance, lowSanity: sanity < 40, lost: sanity <= 0, heartbeatMs: sanity > 0 && distance <= 4 ? 650 + distance * 200 : 0 };
}