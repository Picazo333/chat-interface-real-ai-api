import { describe, expect, it } from "vitest";
import { createRequestGuard } from "../lib/request-guard";

describe("createRequestGuard", () => {
  it("aborts the previous request and ignores its id", () => {
    const guard = createRequestGuard();
    const first = guard.start();
    const second = guard.start();

    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
    expect(guard.isCurrent(first.id)).toBe(false);
    expect(guard.isCurrent(second.id)).toBe(true);
  });

  it("cancel aborts the active request so a late response can be dropped", () => {
    const guard = createRequestGuard();
    const active = guard.start();
    guard.cancel();

    expect(active.signal.aborted).toBe(true);
    expect(guard.isCurrent(active.id)).toBe(false);
  });
});
