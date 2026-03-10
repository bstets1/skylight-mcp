import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SkylightClient } from "../src/api/client.js";
import type { Config } from "../src/config.js";
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  SkylightError,
} from "../src/utils/errors.js";

// Mock the auth module so performLogin doesn't make real HTTP calls
vi.mock("../src/api/auth.js", () => ({
  login: vi.fn(),
}));

function makeTokenConfig(overrides: Partial<Config> = {}): Config {
  return {
    token: "test-token",
    frameId: "frame-123",
    timezone: "America/New_York",
    authType: "bearer",
    ...overrides,
  } as Config;
}

function makeEmailConfig(overrides: Partial<Config> = {}): Config {
  return {
    email: "test@example.com",
    password: "secret",
    frameId: "frame-123",
    timezone: "America/New_York",
    authType: "bearer",
    ...overrides,
  } as Config;
}

describe("SkylightClient", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("buildUrl via request", () => {
    it("constructs URL with frameId replacement", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      });

      const client = new SkylightClient(makeTokenConfig({ frameId: "my-frame" }));
      await client.get("/api/frames/{frameId}/chores");

      const calledUrl = fetchSpy.mock.calls[0][0];
      expect(calledUrl).toBe("https://app.ourskylight.com/api/frames/my-frame/chores");
    });

    it("constructs URL with query params, skipping undefined values", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      });

      const client = new SkylightClient(makeTokenConfig());
      await client.get("/api/test", { foo: "bar", skip: undefined, num: 42 });

      const calledUrl = fetchSpy.mock.calls[0][0];
      expect(calledUrl).toContain("foo=bar");
      expect(calledUrl).toContain("num=42");
      expect(calledUrl).not.toContain("skip");
    });
  });

  describe("auth header construction", () => {
    it("uses Bearer token by default for token-based auth", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const client = new SkylightClient(makeTokenConfig({ authType: "bearer" }));
      await client.get("/api/test");

      const headers = fetchSpy.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe("Bearer test-token");
    });

    it("uses Basic auth when authType is basic for token-based auth", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const client = new SkylightClient(makeTokenConfig({ authType: "basic", token: "abc123" }));
      await client.get("/api/test");

      const headers = fetchSpy.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe("Basic abc123");
    });
  });

  describe("error handling", () => {
    it("throws NotFoundError on 404", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
      });

      const client = new SkylightClient(makeTokenConfig());
      await expect(client.get("/api/test")).rejects.toThrow(NotFoundError);
    });

    it("throws RateLimitError on 429", async () => {
      const headers = new Headers();
      headers.set("Retry-After", "60");

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers,
      });

      const client = new SkylightClient(makeTokenConfig());
      await expect(client.get("/api/test")).rejects.toThrow(RateLimitError);
    });

    it("throws SkylightError on 500 with response body", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers(),
        text: async () => "Internal Server Error",
      });

      const client = new SkylightClient(makeTokenConfig());
      await expect(client.get("/api/test")).rejects.toThrow(SkylightError);
    });

    it("throws AuthenticationError on 401 for token auth", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
      });

      const client = new SkylightClient(makeTokenConfig());
      await expect(client.get("/api/test")).rejects.toThrow(AuthenticationError);
    });
  });

  describe("401 retry logic for email/password auth", () => {
    it("retries once on 401 then throws AuthenticationError", async () => {
      // Import the mocked login
      const { login } = await import("../src/api/auth.js");
      const loginMock = vi.mocked(login);

      // First call: login succeeds, request gets 401
      // Second call (retry): login succeeds again, request still gets 401
      loginMock.mockResolvedValue({
        token: "new-token",
        userId: "user-1",
        email: "test@example.com",
        subscriptionStatus: "free",
      });

      // First request => 401 (triggers retry), retry login, second request => 401 (throws)
      fetchSpy
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: new Headers(),
        });

      const client = new SkylightClient(makeEmailConfig());
      await expect(client.get("/api/test")).rejects.toThrow(AuthenticationError);

      // fetch should have been called twice (original + retry)
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("succeeds on retry after initial 401", async () => {
      const { login } = await import("../src/api/auth.js");
      const loginMock = vi.mocked(login);

      loginMock.mockResolvedValue({
        token: "new-token",
        userId: "user-1",
        email: "test@example.com",
        subscriptionStatus: "free",
      });

      // First request => 401, retry => 200
      fetchSpy
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: "success" }),
        });

      const client = new SkylightClient(makeEmailConfig());
      const result = await client.get("/api/test");

      expect(result).toEqual({ data: "success" });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
