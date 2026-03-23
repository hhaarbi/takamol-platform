import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getProperties: vi.fn().mockResolvedValue([]),
  getPropertyById: vi.fn().mockResolvedValue(null),
  incrementPropertyView: vi.fn().mockResolvedValue(undefined),
  getLeads: vi.fn().mockResolvedValue([]),
  getLeadsCount: vi.fn().mockResolvedValue(0),
  updateLead: vi.fn().mockResolvedValue(undefined),
  getChatHistory: vi.fn().mockResolvedValue([]),
  getOrCreateChatSession: vi.fn().mockResolvedValue({ id: "test-session" }),
  saveChatMessage: vi.fn().mockResolvedValue(undefined),
  createLead: vi.fn().mockResolvedValue(undefined),
  updateLeadBySession: vi.fn().mockResolvedValue(undefined),
  getLeadBySession: vi.fn().mockResolvedValue(null),
  linkSessionToLead: vi.fn().mockResolvedValue(undefined),
  createProperty: vi.fn().mockResolvedValue(undefined),
  updateProperty: vi.fn().mockResolvedValue(undefined),
  deleteProperty: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "مرحباً! كيف يمكنني مساعدتك؟" } }],
  }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.jpg", key: "test.jpg" }),
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@takamol.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("properties.list", () => {
  it("returns empty array when no properties", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.properties.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts listingType filter", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.properties.list({ listingType: "sale" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("properties.getById", () => {
  it("throws NOT_FOUND when property does not exist", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.properties.getById({ id: 9999 })).rejects.toThrow();
  });
});

describe("leads.list", () => {
  it("requires admin role", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.leads.list({})).rejects.toThrow();
  });

  it("returns leads for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.leads.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("leads.count", () => {
  it("returns 0 for admin when no leads", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const count = await caller.leads.count();
    expect(typeof count).toBe("number");
  });
});

describe("chat.sendMessage", () => {
  it("returns AI reply for valid message", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.chat.sendMessage({
      sessionId: "test-session-123",
      message: "مرحباً، أريد شراء شقة",
    });
    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
    expect(result.reply.length).toBeGreaterThan(0);
  });

  it("rejects empty messages", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.chat.sendMessage({ sessionId: "test", message: "" })
    ).rejects.toThrow();
  });
});

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const user = await caller.auth.me();
    expect(user).not.toBeNull();
    expect(user?.role).toBe("admin");
  });
});
