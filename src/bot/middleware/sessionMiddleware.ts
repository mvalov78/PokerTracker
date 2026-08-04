/**
 * Session middleware for Telegraf.
 *
 * Loads bot session from DB before handlers and saves it after.
 * Guarantees `next()` is called at most once — calling it again in a catch
 * block causes Telegraf's "next() called multiple times" and silently drops
 * the user-facing reply when a handler throws.
 */

import { BotSessionService, type BotSessionData } from "@/services/botSessionService";

function emptySession(userId: number): BotSessionData {
  return {
    userId: userId.toString(),
    currentAction: undefined,
    tournamentData: undefined,
    ocrData: undefined,
  };
}

export function createSessionMiddleware(logPrefix = "[Bot]") {
  return async (
    ctx: { from?: { id?: number }; session?: BotSessionData },
    next: () => Promise<void>,
  ) => {
    const userId = ctx.from?.id;
    if (!userId) {
      return next();
    }

    try {
      ctx.session = await BotSessionService.getSession(userId);
    } catch (error) {
      console.error(`${logPrefix} Session load error:`, error);
      ctx.session = emptySession(userId);
    }

    try {
      await next();
    } finally {
      try {
        if (ctx.session) {
          await BotSessionService.updateSession(userId, ctx.session);
        }
      } catch (error) {
        console.error(`${logPrefix} Session save error:`, error);
      }
    }
  };
}
