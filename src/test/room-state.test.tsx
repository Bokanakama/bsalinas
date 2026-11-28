import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newState } from "@/lib/game";

const mocks = vi.hoisted(() => ({ request: vi.fn(), subscribe: vi.fn(), on: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/room.functions", () => ({ roomRequest: mocks.request }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { channel: () => ({ on: mocks.on, subscribe: mocks.subscribe }), removeChannel: mocks.remove } }));
import { useRoomState } from "@/lib/room";

describe("Room state reads", () => {
  beforeEach(() => {
    vi.clearAllMocks(); localStorage.clear();
    localStorage.setItem("boro-access-ABCD-player", "player-token");
    mocks.subscribe.mockImplementation((cb: (status: string) => void) => cb("SUBSCRIBED"));
  });
  afterEach(() => { vi.useRealTimers(); });

  it("reuses the authorized opening snapshot instead of a second initial read", async () => {
    mocks.request.mockResolvedValue({ result: { channel: "channel", state: newState(), updated_at: "2026-11-28T00:00:00Z" } });
    const hook = renderHook(() => useRoomState("ABCD"));
    await waitFor(() => expect(hook.result.current.state?.phase).toBe("lobby"));
    expect(mocks.request).toHaveBeenCalledTimes(1);
    hook.unmount();
  });

  it("keeps the existing object when an unchanged response arrives", async () => {
    const initial = newState();
    mocks.request.mockResolvedValueOnce({ result: { channel: "channel", state: initial, updated_at: "2026-11-28T00:00:00Z" } });
    const hook = renderHook(() => useRoomState("ABCD"));
    await waitFor(() => expect(hook.result.current.state).toBe(initial));
    mocks.request.mockResolvedValue({ result: { channel: "channel", state: newState(), updated_at: "2026-11-28T00:00:00Z" } });
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(mocks.request).toHaveBeenCalledTimes(2);
    expect(hook.result.current.state).toBe(initial);
    hook.unmount();
  });

  it("reads immediately after reconnect and applies a newer snapshot", async () => {
    const initial = newState();
    mocks.request.mockResolvedValueOnce({ result: { channel: "channel", state: initial, updated_at: "2026-11-28T00:00:00Z" } });
    const hook = renderHook(() => useRoomState("ABCD"));
    await waitFor(() => expect(hook.result.current.state).toBe(initial));
    const newer = { ...initial, round: 3 };
    mocks.request.mockResolvedValue({ result: { channel: "channel", state: newer, updated_at: "2026-11-28T00:00:01Z" } });
    const callback = mocks.subscribe.mock.calls[0]?.[0] as ((status: string) => void) | undefined;
    expect(callback).toBeTypeOf("function");
    await act(async () => { callback?.("CHANNEL_ERROR"); callback?.("SUBSCRIBED"); });
    expect(hook.result.current.state?.round).toBe(3);
    hook.unmount();
  });
});