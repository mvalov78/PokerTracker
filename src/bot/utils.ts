/**
 * Telegram bot utilities
 */

import {
  formatCurrency as commonFormatCurrency,
  formatPercentage as commonFormatPercentage,
  formatDate,
  formatTimeUntil,
} from "@/lib/common/formatters";
import type { BotContext } from "./index";

// Re-export formatters with bot-specific behavior
export function formatCurrency(amount: number, currency = "USD"): string {
  return commonFormatCurrency(amount, currency);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return commonFormatPercentage(value, decimals, true);
}

export { formatDate, formatTimeUntil };

/**
 * Create inline keyboard with buttons
 */
export function createInlineKeyboard(
  buttons: Array<Array<{ text: string; data: string }>>,
): any {
  return {
    inline_keyboard: buttons.map((row) =>
      row.map((button) => ({
        text: button.text,
        callback_data: button.data,
      })),
    ),
  };
}

/**
 * Create selection keyboard from a list of items
 */
export function createSelectionKeyboard<T>(
  items: T[],
  getLabel: (item: T) => string,
  getValue: (item: T) => string,
  prefix: string = "select",
  maxPerRow: number = 1,
): any {
  const buttons = [];

  for (let i = 0; i < items.length; i += maxPerRow) {
    const row = items.slice(i, i + maxPerRow).map((item) => ({
      text: getLabel(item),
      callback_data: `${prefix}:${getValue(item)}`,
    }));
    buttons.push(row);
  }

  return { inline_keyboard: buttons };
}

/**
 * Escape special characters for Markdown
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

/**
 * Get user information from context
 */
export function getUserInfo(ctx: BotContext): {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
} {
  const user = ctx.from;

  if (!user) {
    return {
      id: "unknown",
      fullName: "Неизвестный пользователь",
    };
  }

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username ||
    `User ${user.id}`;

  return {
    id: user.id.toString(),
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    fullName,
  };
}

/**
 * Check if user has access based on allowed users list
 */
export function checkUserAccess(
  ctx: BotContext,
  allowedUsers?: string[],
): boolean {
  if (!allowedUsers || allowedUsers.length === 0) {
    return true; // Access for everyone if list is not set
  }

  const userId = ctx.from?.id.toString();
  const username = ctx.from?.username;

  return (
    !!(userId && allowedUsers.includes(userId)) ||
    !!(username && allowedUsers.includes(`@${username}`))
  );
}

/**
 * Log user action
 */
export function logUserAction(ctx: BotContext, action: string, details?: any) {
  const user = getUserInfo(ctx);
  const timestamp = new Date().toISOString();

  console.warn(
    `[Bot Action] ${timestamp} - User: ${user.fullName} (${user.id}) - Action: ${action}`,
    details ? JSON.stringify(details) : "",
  );
}

/**
 * Create progress bar
 */
export function createProgressBar(
  current: number,
  total: number,
  length: number = 10,
): string {
  const percentage = Math.min(current / total, 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;

  const filledChar = "█";
  const emptyChar = "░";

  return filledChar.repeat(filled) + emptyChar.repeat(empty);
}

/**
 * Generate random ID
 */
export function generateId(prefix: string = "", length: number = 8): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = prefix;

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Validate tournament data
 */
export function validateTournamentData(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push("Название турнира не может быть пустым");
  }

  if (!data.date || isNaN(new Date(data.date).getTime())) {
    errors.push("Некорректная дата турнира");
  }

  if (
    !data.buyin ||
    isNaN(parseFloat(data.buyin)) ||
    parseFloat(data.buyin) < 0
  ) {
    errors.push("Бай-ин должен быть положительным числом");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate tournament result
 */
export function validateTournamentResult(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (
    !data.position ||
    isNaN(parseInt(data.position)) ||
    parseInt(data.position) < 1
  ) {
    errors.push("Место должно быть положительным числом");
  }

  if (
    data.payout !== undefined &&
    (isNaN(parseFloat(data.payout)) || parseFloat(data.payout) < 0)
  ) {
    errors.push("Выигрыш должен быть неотрицательным числом");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse command with parameters
 */
export function parseCommand(text: string): {
  command: string;
  args: string[];
} {
  const parts = text.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  return { command, args };
}

/**
 * Create error message
 */
export function createErrorMessage(error: string, suggestion?: string): string {
  let message = `❌ ${error}`;

  if (suggestion) {
    message += `\n\n💡 ${suggestion}`;
  }

  return message;
}

/**
 * Create success message
 */
export function createSuccessMessage(
  message: string,
  details?: string,
): string {
  let result = `✅ ${message}`;

  if (details) {
    result += `\n\n${details}`;
  }

  return result;
}

/**
 * Truncate text to max length
 */
export function truncateText(text: string, maxLength: number = 4096): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Create menu with pagination
 */
export function createPaginatedMenu<T>(
  items: T[],
  page: number,
  pageSize: number,
  getLabel: (item: T) => string,
  getValue: (item: T) => string,
  prefix: string = "page",
): { keyboard: any; hasNext: boolean; hasPrev: boolean } {
  const startIndex = page * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);
  const pageItems = items.slice(startIndex, endIndex);

  const buttons = pageItems.map((item) => [
    {
      text: getLabel(item),
      callback_data: getValue(item),
    },
  ]);

  // Add navigation buttons
  const navButtons = [];
  if (page > 0) {
    navButtons.push({
      text: "◀️ Назад",
      callback_data: `${prefix}:${page - 1}`,
    });
  }

  if (endIndex < items.length) {
    navButtons.push({
      text: "Далее ▶️",
      callback_data: `${prefix}:${page + 1}`,
    });
  }

  if (navButtons.length > 0) {
    buttons.push(navButtons);
  }

  return {
    keyboard: { inline_keyboard: buttons },
    hasNext: endIndex < items.length,
    hasPrev: page > 0,
  };
}
