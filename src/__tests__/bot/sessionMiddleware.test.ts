/**
 * Tests for Telegraf session middleware
 */

import { createSessionMiddleware } from "@/bot/middleware/sessionMiddleware";
import { BotSessionService } from "@/services/botSessionService";

jest.mock("@/services/botSessionService", () => ({
  BotSessionService: {
    getSession: jest.fn(),
    updateSession: jest.fn(),
  },
}));

const mockGetSession = BotSessionService.getSession as jest.Mock;
const mockUpdateSession = BotSessionService.updateSession as jest.Mock;

describe("createSessionMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      userId: "42",
      currentAction: undefined,
    });
    mockUpdateSession.mockResolvedValue(true);
  });

  it("calls next exactly once when handler succeeds", async () => {
    const middleware = createSessionMiddleware("[Test]");
    const next = jest.fn().mockResolvedValue(undefined);
    const ctx = { from: { id: 42 }, session: undefined as any };

    await middleware(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockGetSession).toHaveBeenCalledWith(42);
    expect(mockUpdateSession).toHaveBeenCalledWith(42, ctx.session);
  });

  it("calls next exactly once when handler throws (no double-next)", async () => {
    const middleware = createSessionMiddleware("[Test]");
    const next = jest.fn().mockRejectedValue(new Error("handler failed"));
    const ctx = { from: { id: 42 }, session: undefined as any };

    await expect(middleware(ctx, next)).rejects.toThrow("handler failed");

    expect(next).toHaveBeenCalledTimes(1);
    // Session still saved in finally after the failed handler
    expect(mockUpdateSession).toHaveBeenCalledTimes(1);
  });

  it("still runs next once if session load fails", async () => {
    mockGetSession.mockRejectedValue(new Error("db down"));
    const middleware = createSessionMiddleware("[Test]");
    const next = jest.fn().mockResolvedValue(undefined);
    const ctx = { from: { id: 42 }, session: undefined as any };

    await middleware(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.session).toEqual({
      userId: "42",
      currentAction: undefined,
      tournamentData: undefined,
      ocrData: undefined,
    });
  });

  it("skips session when there is no user id", async () => {
    const middleware = createSessionMiddleware("[Test]");
    const next = jest.fn().mockResolvedValue(undefined);
    const ctx = { from: undefined, session: undefined as any };

    await middleware(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockUpdateSession).not.toHaveBeenCalled();
  });

  it("does not fail the request if session save fails", async () => {
    mockUpdateSession.mockRejectedValue(new Error("save failed"));
    const middleware = createSessionMiddleware("[Test]");
    const next = jest.fn().mockResolvedValue(undefined);
    const ctx = { from: { id: 42 }, session: undefined as any };

    await expect(middleware(ctx, next)).resolves.toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
