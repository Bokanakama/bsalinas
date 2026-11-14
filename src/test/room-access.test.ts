import { beforeEach, describe, expect, it, vi } from "vitest";

const request = vi.hoisted(() => vi.fn());
vi.mock("@/lib/room.functions", () => ({ roomRequest: request }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { accessRoom, createRoom, ensureRoomAccess } from "@/lib/room";

describe("Room credentials", () => {
  beforeEach(() => { localStorage.clear(); request.mockReset(); });

  it("does not grant master access from the legacy browser flag", async () => {
    localStorage.setItem("boro-master-ABCD", "1");
    expect(await ensureRoomAccess("ABCD", true)).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it("stores a server-issued master credential separately from player access", async () => {
    request.mockResolvedValue({ token: "master-credential", result: { channel: "channel" } });
    await createRoom("ABCD");
    expect(localStorage.getItem("boro-access-ABCD-master")).toBe("master-credential");
    expect(localStorage.getItem("boro-access-ABCD-player")).toBeNull();
    await expect(accessRoom("ABCD", "read")).rejects.toThrow("não autorizado");
  });

  it("sends only the credential for the requested room and role", async () => {
    localStorage.setItem("boro-access-ABCD-player", "player-credential");
    localStorage.setItem("boro-access-ABCD-master", "master-credential");
    request.mockResolvedValue({ result: [] });
    await accessRoom("ABCD", "actions", {}, true);
    expect(request).toHaveBeenCalledWith({ data: { op: "actions", code: "ABCD", token: "master-credential", payload: {} } });
    await expect(accessRoom("EFGH", "read")).rejects.toThrow("não autorizado");
  });
});