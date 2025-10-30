/**
 * Конфигурация Telegram бота
 */

export interface BotConfig {
  token: string;
  webhookUrl?: string;
  webhookSecret?: string;
  apiUrl: string;
  allowedUsers?: string[];
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  features: {
    ocrEnabled: boolean;
    notificationsEnabled: boolean;
    analyticsEnabled: boolean;
  };
  messages: {
    welcome: string;
    help: string;
    errors: {
      generic: string;
      unauthorized: string;
      rateLimit: string;
      ocrFailed: string;
    };
  };
}

export const defaultBotConfig: BotConfig = {
  token: process.env.TELEGRAM_BOT_TOKEN || "mock-bot-token",
  webhookUrl: undefined, // Не используется в polling режиме
  webhookSecret: undefined, // Не используется в polling режиме
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",

  rateLimit: {
    maxRequests: 30, // 30 запросов
    windowMs: 60000, // за 1 минуту
  },

  features: {
    ocrEnabled: true,
    notificationsEnabled: true,
    analyticsEnabled: true,
  },

  messages: {
    welcome: `
🎰 **Добро пожаловать в PokerTracker Pro Bot!**

Я помогу вам отслеживать результаты турниров по покеру:

🔹 Регистрируйте турниры через фото билета
🔹 Добавляйте результаты быстро и удобно  
🔹 Получайте статистику и аналитику
🔹 Настраивайте уведомления

Используйте /help для получения списка команд.
    `,

    help: `
🤖 **Команды PokerTracker Pro Bot:**

**📝 Турниры:**
/register - Зарегистрировать турнир
/result - Добавить результат
/tournaments - Список турниров

**📊 Статистика:**
/stats - Ваша статистика

**⚙️ Настройки:**
/settings - Настройки уведомлений

**📷 Фото билетов:**
Просто отправьте фото билета для автоматической регистрации турнира.
    `,

    errors: {
      generic:
        "❌ Произошла ошибка. Попробуйте еще раз или обратитесь к администратору.",
      unauthorized: "🚫 У вас нет доступа к этому боту.",
      rateLimit:
        "⏳ Слишком много запросов. Подождите немного и попробуйте снова.",
      ocrFailed:
        "❌ Не удалось распознать данные на билете. Попробуйте сделать более четкое фото.",
    },
  },
};

/**
 * Получение конфигурации бота
 */
export function getBotConfig(): BotConfig {
  return {
    ...defaultBotConfig,
    // Переопределяем настройки из переменных окружения
    token: process.env.TELEGRAM_BOT_TOKEN || defaultBotConfig.token,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || defaultBotConfig.apiUrl,

    // Парсим разрешенных пользователей из переменной окружения
    allowedUsers: process.env.TELEGRAM_ALLOWED_USERS?.split(",").map((id) =>
      id.trim(),
    ),

    features: {
      ocrEnabled: process.env.BOT_OCR_ENABLED !== "false",
      notificationsEnabled: process.env.BOT_NOTIFICATIONS_ENABLED !== "false",
      analyticsEnabled: process.env.BOT_ANALYTICS_ENABLED !== "false",
    },
  };
}

/**
 * Валидация конфигурации бота
 */
export function validateBotConfig(config: BotConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.token || config.token === "mock-bot-token") {
    errors.push("TELEGRAM_BOT_TOKEN не установлен или использует мок значение");
  }

  if (config.rateLimit.maxRequests <= 0) {
    errors.push("rateLimit.maxRequests должен быть положительным числом");
  }

  if (config.rateLimit.windowMs <= 0) {
    errors.push("rateLimit.windowMs должен быть положительным числом");
  }

  if (!config.apiUrl) {
    errors.push("apiUrl не может быть пустым");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Логирование конфигурации (без секретных данных)
 */
export function logBotConfig(config: BotConfig) {
  console.warn("🤖 Конфигурация Telegram бота:");
  console.warn(`  - Webhook URL: ${config.webhookUrl || "не установлен"}`);
  console.warn(`  - API URL: ${config.apiUrl}`);
  console.warn(`  - OCR включен: ${config.features.ocrEnabled}`);
  console.warn(
    `  - Уведомления включены: ${config.features.notificationsEnabled}`,
  );
  console.warn(`  - Аналитика включена: ${config.features.analyticsEnabled}`);
  console.warn(
    `  - Rate limit: ${config.rateLimit.maxRequests} запросов за ${config.rateLimit.windowMs}ms`,
  );

  if (config.allowedUsers) {
    console.warn(
      `  - Разрешенные пользователи: ${config.allowedUsers.length} пользователей`,
    );
  } else {
    console.warn("  - Разрешенные пользователи: все пользователи");
  }
}
