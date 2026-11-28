import { describe, expect, it, vi } from "vitest";
import { createRefreshQueue, createStateWriter, roomPollMs } from "@/lib/room-sync";

function deferred() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((r) => { resolve = r; });
  return { promise, resolve };
}

describe("Room synchronization", () => {
  it("retains fast disconnected polling and reduces healthy polling fourfold", () => {
    expect(roomPollMs(false)).toBe(1500);
    expect(roomPollMs(true)).toBe(6000);
  });
  it("coalesces doorbells received during a read into one trailing read", async () => {
    const first = deferred();
    const read = vi.fn().mockImplementationOnce(() => first.promise).mockResolvedValue(undefined);
    const queue = createRefreshQueue(read);
    const task = queue.refresh(); queue.refresh(); queue.refresh();
    expect(read).toHaveBeenCalledTimes(1);
    first.resolve(); await task;
    expect(read).toHaveBeenCalledTimes(2);
  });
  it("does not run trailing reads after unmount", async () => {
    const first = deferred();
    const read = vi.fn(() => first.promise);
    const queue = createRefreshQueue(read);
    const task = queue.refresh(); queue.refresh(); queue.stop(); first.resolve(); await task;
    expect(read).toHaveBeenCalledTimes(1);
  });
  it("retries a failed write with the newest snapshot and waits for acknowledgement", async () => {
    const gate = deferred();
    const write = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    const save = createStateWriter(write, () => gate.promise);
    const task = save("ABCD", 1); await Promise.resolve(); save("ABCD", 2);
    gate.resolve(); await task;
    expect(write.mock.calls).toEqual([["ABCD", 1], ["ABCD", 2]]);
  });
  it("does not serialize unrelated rooms", async () => {
    const gate = deferred();
    const write = vi.fn((code: string) => code === "ABCD" ? gate.promise : Promise.resolve());
    const save = createStateWriter(write);
    const first = save("ABCD", 1); await save("EFGH", 2);
    expect(write).toHaveBeenCalledWith("EFGH", 2);
    gate.resolve(); await first;
  });
  it("bounds retries and allows the next save to recover", async () => {
    const write = vi.fn().mockRejectedValue(new Error("offline"));
    const save = createStateWriter(write, () => Promise.resolve());
    await expect(save("ABCD", 1)).rejects.toThrow("offline");
    expect(write).toHaveBeenCalledTimes(3);
    write.mockResolvedValue(undefined); await save("ABCD", 2);
    expect(write).toHaveBeenLastCalledWith("ABCD", 2);
  });
});