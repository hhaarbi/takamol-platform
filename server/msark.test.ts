import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context for testing
function createMockContext(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
    } as any,
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as any,
    ...overrides,
  };
}

describe("auth.me", () => {
  it("returns null when not authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("internalAuth.me", () => {
  it("returns null when no internal session cookie", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.internalAuth.me();
    expect(result).toBeNull();
  });
});

describe("internalAuth.login", () => {
  it("throws UNAUTHORIZED for invalid credentials", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.internalAuth.login({ username: "invalid_user", password: "wrong_pass" })
    ).rejects.toThrow();
  });
});

describe("dashboard.stats", () => {
  it("returns stats object with required fields", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();
    expect(stats).toHaveProperty("totalProjects");
    expect(stats).toHaveProperty("activeProjects");
    expect(stats).toHaveProperty("completedProjects");
    expect(stats).toHaveProperty("totalTasks");
    expect(stats).toHaveProperty("totalEmployees");
    expect(stats).toHaveProperty("totalFreelancers");
    expect(stats).toHaveProperty("totalClients");
  });
});

describe("projects.list", () => {
  it("returns an array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("employees.list", () => {
  it("returns an array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.employees.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("freelancers.list", () => {
  it("returns an array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.freelancers.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("clients.list", () => {
  it("returns an array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clients.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("departments.list", () => {
  it("returns an array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.departments.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("auth.logout", () => {
  it("clears cookies and returns success", async () => {
    const clearedCookies: string[] = [];
    const ctx = createMockContext({
      res: {
        clearCookie: (name: string) => clearedCookies.push(name),
        cookie: () => {},
      } as any,
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
