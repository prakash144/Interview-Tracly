import { describe, it, expect, beforeEach, vi } from "vitest";
import { toast } from "sonner";
import { notify, setDnd, getDnd, onNotification, onDndChange } from "@/lib/notifications/service";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(() => "loading-id"),
    dismiss: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  setDnd(false);
});

describe("notify.success", () => {
  it("calls toast.success with title", () => {
    notify.success("Test passed");
    expect(toast.success).toHaveBeenCalledWith("Test passed", expect.any(Object));
  });

  it("emits a history item", () => {
    const cb = vi.fn();
    const unsub = onNotification(cb);
    notify.success("Test passed");
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ title: "Test passed", type: "success" }));
    unsub();
  });

  it("includes description in toast props", () => {
    notify.success("Done", { description: "All good" });
    expect(toast.success).toHaveBeenCalledWith("Done", expect.objectContaining({ description: "All good" }));
  });

  it("supports custom id", () => {
    notify.success("Done", { id: "custom-id" });
    expect(toast.success).toHaveBeenCalledWith("Done", expect.objectContaining({ id: "custom-id" }));
  });

  it("sets longer duration for undo actions", () => {
    notify.success("Done", { action: { label: "Undo", onClick: () => {} } });
    expect(toast.success).toHaveBeenCalledWith("Done", expect.objectContaining({ duration: 6000 }));
  });

  it("is suppressed during DND unless important", () => {
    setDnd(true);
    const cb = vi.fn();
    onNotification(cb);
    notify.success("Should be silent");
    expect(cb).not.toHaveBeenCalled();

    notify.success("Important one", { important: true });
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ title: "Important one" }));
  });
});

describe("notify.error", () => {
  it("calls toast.error", () => {
    notify.error("Oops");
    expect(toast.error).toHaveBeenCalledWith("Oops", expect.any(Object));
  });
});

describe("notify.info", () => {
  it("calls toast.info", () => {
    notify.info("FYI");
    expect(toast.info).toHaveBeenCalledWith("FYI", expect.any(Object));
  });
});

describe("notify.warning", () => {
  it("calls toast.warning", () => {
    notify.warning("Caution");
    expect(toast.warning).toHaveBeenCalledWith("Caution", expect.any(Object));
  });
});

describe("notify.undo", () => {
  it("calls toast.info with Undo action", () => {
    const onUndo = vi.fn();
    notify.undo("Deleted item", onUndo);
    expect(toast.info).toHaveBeenCalledWith("Deleted item", expect.objectContaining({
      duration: 6000,
      action: { label: "Undo", onClick: onUndo },
    }));
  });

  it("sets category to system by default", () => {
    const cb = vi.fn();
    const unsub = onNotification(cb);
    notify.undo("Deleted", () => {});
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ category: "system" }));
    unsub();
  });
});

describe("notify.promise", () => {
  it("shows loading then success on resolve", async () => {
    const promise = Promise.resolve("ok");
    const result = await notify.promise(promise, {
      loading: "Loading...",
      success: "Done!",
      error: "Failed",
    });
    expect(result).toBe("ok");
    expect(toast.loading).toHaveBeenCalledWith("Loading...", expect.any(Object));
    const loadingCallArgs = (toast.loading as ReturnType<typeof vi.fn>).mock.calls[0];
    const loadingId = loadingCallArgs[1]?.id as string;
    expect(loadingId).toMatch(/^n_/);
    expect(toast.dismiss).toHaveBeenCalledWith(loadingId);
    expect(toast.success).toHaveBeenCalledWith("Done!", expect.any(Object));
  });

  it("shows loading then error on reject", async () => {
    await expect(
      notify.promise(Promise.reject(new Error("Boom")), { loading: "Loading...", success: "Done!", error: "Failed" })
    ).rejects.toThrow("Boom");
    expect(toast.error).toHaveBeenCalledWith("Failed", expect.objectContaining({ description: "Boom" }));
  });

  it("returns promise directly during DND when not important", () => {
    setDnd(true);
    const promise = Promise.resolve("ok");
    const result = notify.promise(promise, {
      loading: "Loading...", success: "Done!", error: "Failed",
    });
    expect(result).toBe(promise);
  });
});

describe("notify.dismiss", () => {
  it("calls toast.dismiss with id", () => {
    notify.dismiss("some-id");
    expect(toast.dismiss).toHaveBeenCalledWith("some-id");
  });
});

describe("notify.dismissAll", () => {
  it("calls toast.dismiss", () => {
    notify.dismissAll();
    expect(toast.dismiss).toHaveBeenCalledWith();
  });
});

describe("DND lifecycle", () => {
  it("getDnd returns false initially", () => {
    expect(getDnd()).toBe(false);
  });

  it("setDnd updates the value", () => {
    setDnd(true);
    expect(getDnd()).toBe(true);
    setDnd(false);
    expect(getDnd()).toBe(false);
  });

  it("notifies listeners on change", () => {
    const cb = vi.fn();
    const unsub = onDndChange(cb);
    setDnd(true);
    expect(cb).toHaveBeenCalledWith(true);
    setDnd(false);
    expect(cb).toHaveBeenCalledWith(false);
    unsub();
  });

  it("cleanup removes listener", () => {
    const cb = vi.fn();
    const unsub = onDndChange(cb);
    unsub();
    setDnd(true);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("onNotification cleanup", () => {
  it("removes listener on unsub", () => {
    const cb = vi.fn();
    const unsub = onNotification(cb);
    unsub();
    notify.success("Should not fire");
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("notification item timestamp", () => {
  it("includes a recent timestamp", () => {
    const before = Date.now();
    const cb = vi.fn();
    const unsub = onNotification(cb);
    notify.info("Timestamp test");
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ timestamp: expect.any(Number) }));
    const item = cb.mock.calls[0][0] as { timestamp: number };
    expect(item.timestamp).toBeGreaterThanOrEqual(before);
    expect(item.timestamp).toBeLessThanOrEqual(Date.now());
    unsub();
  });
});
