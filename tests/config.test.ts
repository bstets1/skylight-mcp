import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to test loadConfig which reads process.env and calls process.exit on failure.
// We'll mock process.exit and manipulate process.env directly.

describe("config", () => {
  const originalEnv = { ...process.env };
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear all SKYLIGHT_ env vars
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("SKYLIGHT_")) {
        delete process.env[key];
      }
    }
    // Mock process.exit to throw instead of killing the process
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    // Suppress console.error from loadConfig's error output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
    // Reset module cache so loadConfig re-reads env
    vi.resetModules();
  });

  async function importLoadConfig() {
    const mod = await import("../src/config.js");
    return mod.loadConfig;
  }

  it("returns valid config with email + password", async () => {
    process.env.SKYLIGHT_EMAIL = "test@example.com";
    process.env.SKYLIGHT_PASSWORD = "secret123";
    process.env.SKYLIGHT_FRAME_ID = "frame-abc";

    const loadConfig = await importLoadConfig();
    const config = loadConfig();

    expect(config.email).toBe("test@example.com");
    expect(config.password).toBe("secret123");
    expect(config.frameId).toBe("frame-abc");
    expect(config.timezone).toBe("America/New_York");
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("returns valid config with token", async () => {
    process.env.SKYLIGHT_TOKEN = "my-api-token";
    process.env.SKYLIGHT_FRAME_ID = "frame-abc";

    const loadConfig = await importLoadConfig();
    const config = loadConfig();

    expect(config.token).toBe("my-api-token");
    expect(config.frameId).toBe("frame-abc");
    expect(config.authType).toBe("bearer");
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("exits with error when neither email/password nor token provided", async () => {
    process.env.SKYLIGHT_FRAME_ID = "frame-abc";

    const loadConfig = await importLoadConfig();
    expect(() => loadConfig()).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with error when email provided without password", async () => {
    process.env.SKYLIGHT_EMAIL = "test@example.com";
    process.env.SKYLIGHT_FRAME_ID = "frame-abc";

    const loadConfig = await importLoadConfig();
    expect(() => loadConfig()).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("applies default timezone when not specified", async () => {
    process.env.SKYLIGHT_TOKEN = "my-api-token";
    process.env.SKYLIGHT_FRAME_ID = "frame-abc";

    const loadConfig = await importLoadConfig();
    const config = loadConfig();

    expect(config.timezone).toBe("America/New_York");
  });

  it("accepts custom timezone", async () => {
    process.env.SKYLIGHT_TOKEN = "my-api-token";
    process.env.SKYLIGHT_FRAME_ID = "frame-abc";
    process.env.SKYLIGHT_TIMEZONE = "America/Los_Angeles";

    const loadConfig = await importLoadConfig();
    const config = loadConfig();

    expect(config.timezone).toBe("America/Los_Angeles");
  });
});
