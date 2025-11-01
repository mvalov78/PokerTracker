/**
 * Telegram Bot для PokerTracker Pro
 *
 * Основные функции:
 * - Регистрация турниров через фото билета
 * - Добавление результатов турниров
 * - Получение статистики
 * - Уведомления о турнирах
 *
 * Режим работы: Polling (опрос сервера Telegram)
 */

// Реальные импорты Telegraf
import { Telegraf, type Context } from "telegraf";
import { message } from "telegraf/filters";
import { BotCommands } from "./commands";
import { PhotoHandler } from "./handlers/photoHandler";
import { NotificationService } from "./services/notificationService";
import { getBotConfig } from "./config";
import { BotSettingsService } from "@/services/botSettingsService";
import { BotSessionService } from "@/services/botSessionService";

export interface SessionData {
  userId?: string;
  currentAction?: string;
  tournamentData?: any;
  ocrData?: any;
}

export interface BotContext extends Context {
  // Расширяем стандартный Context от Telegraf
  session: SessionData;
}

class PokerTrackerBot {
  private config: any;
  private commands: BotCommands;
  private photoHandler: PhotoHandler;
  private notificationService: NotificationService;
  private isRunning: boolean = false;
  private pollingInterval?: NodeJS.Timeout;
  private bot?: Telegraf<BotContext>;
  // Сессии теперь хранятся в БД через BotSessionService

  constructor(token?: string) {
    this.config = getBotConfig();
    this.commands = new BotCommands();
    this.photoHandler = new PhotoHandler();
    this.notificationService = new NotificationService();

    // Создаем бота если есть токен
    if (this.config.token && this.config.token !== "mock-bot-token") {
      console.warn(
        "🔑 Инициализируем бота с реальным токеном:",
        this.config.token.substring(0, 10) + "...",
      );
      this.bot = new Telegraf<BotContext>(this.config.token);
      console.warn("📝 Настраиваем команды и обработчики...");
      this.setupBot();
      console.warn("🤖 PokerTracker Bot инициализирован с реальным токеном");
    } else {
      console.warn("🤖 PokerTracker Bot инициализирован в мок режиме");
    }
  }

  /**
   * Настройка реального Telegraf бота
   */
  private setupBot() {
    if (!this.bot) {return;}

    // Middleware для сессий (загрузка из БД)
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      if (!userId) {return next();}

      try {
        // Загружаем сессию из БД
        const sessionData = await BotSessionService.getSession(userId);
        ctx.session = sessionData;
        
        // Выполняем обработчик
        await next();
        
        // Сохраняем сессию обратно в БД
        await BotSessionService.updateSession(userId, ctx.session);
      } catch (error) {
        console.error('Session middleware error:', error);
        // Создаем пустую сессию в случае ошибки
        ctx.session = {
          userId: userId.toString(),
          currentAction: undefined,
          tournamentData: undefined,
          ocrData: undefined,
        };
        await next();
      }
    });

    // Логирование сообщений
    this.bot.use((ctx, next) => {
      const messageType = ctx.message
        ? "text" in ctx.message
          ? "text"
          : "photo" in ctx.message
            ? "photo"
            : "document" in ctx.message
              ? "document"
              : "other"
        : "no-message";

      console.warn(
        `[Real Bot] Message from ${ctx.from?.username || ctx.from?.id}: ${messageType}`,
      );

      if (ctx.message && "photo" in ctx.message) {
        console.warn(
          `[Real Bot] Photo details: ${ctx.message.photo.length} sizes`,
        );
      }

      return next();
    });

    // Команды с логированием
    this.bot.command("start", async (ctx) => {
      try {
        console.warn("🤖 Получена команда /start");
        await this.commands.start(ctx);
      } catch (error) {
        console.error("❌ Ошибка при обработке команды /start:", error);
        await ctx.reply("❌ Произошла ошибка при обработке команды /start");
      }
    });
    this.bot.command("link", async (ctx) => {
      try {
        console.warn("🤖 Получена команда /link");
        await this.commands.link(ctx);
      } catch (error) {
        console.error("❌ Ошибка при обработке команды /link:", error);
        await ctx.reply("❌ Произошла ошибка при обработке команды /link");
      }
    });
    this.bot.command("help", async (ctx) => {
      try {
        console.warn("🤖 Получена команда /help");
        await this.commands.help(ctx);
      } catch (error) {
        console.error("❌ Ошибка при обработке команды /help:", error);
        await ctx.reply("❌ Произошла ошибка при обработке команды /help");
      }
    });
    this.bot.command("register", async (ctx) => {
      console.warn("🤖 Получена команда /register");
      await this.commands.registerTournament(ctx);
    });
    this.bot.command("result", async (ctx) => {
      console.warn("🤖 Получена команда /result");
      await this.commands.addResult(ctx);
    });
    this.bot.command("stats", async (ctx) => {
      console.warn("🤖 Получена команда /stats");
      await this.commands.getStats(ctx);
    });
    this.bot.command("tournaments", async (ctx) => {
      console.warn("🤖 Получена команда /tournaments");
      await this.commands.listTournaments(ctx);
    });
    this.bot.command("settings", async (ctx) => {
      console.warn("🤖 Получена команда /settings");
      await this.commands.settings(ctx);
    });
    this.bot.command("venue", async (ctx) => {
      console.warn("🤖 Получена команда /venue");
      await this.commands.showCurrentVenue(ctx);
    });
    this.bot.command("setvenue", async (ctx) => {
      console.warn("🤖 Получена команда /setvenue");
      await this.commands.setCurrentVenue(ctx);
    });

    // Обработка фотографий
    this.bot.on(message("photo"), async (ctx) => {
      console.warn("📸 Получена фотография от пользователя!");
      console.warn("📸 Количество фото в сообщении:", ctx.message.photo.length);
      await this.photoHandler.handlePhoto(ctx);
    });

    // Обработка документов (включая фото, отправленные как файлы)
    this.bot.on(message("document"), async (ctx) => {
      console.warn("📄 Получен документ от пользователя!");
      console.warn("📄 MIME type:", ctx.message.document.mime_type);
      console.warn("📄 Имя файла:", ctx.message.document.file_name);

      // Проверяем, является ли документ изображением
      if (ctx.message.document.mime_type?.startsWith("image/")) {
        console.warn("📸 Документ является изображением, обрабатываем как фото");
        await this.photoHandler.handleDocumentAsPhoto(ctx);
      } else {
        await ctx.reply(
          "📄 Я получил документ, но для обработки билетов турниров нужны изображения.\n\n" +
            "💡 Попробуйте:\n" +
            "• Отправить фото через камеру\n" +
            "• Отправить изображение из галереи\n" +
            "• Убедиться, что файл имеет формат JPG, PNG или другой формат изображения",
        );
      }
    });

    // Обработка текстовых сообщений
    this.bot.on(message("text"), this.handleTextMessage.bind(this));

    // Обработка callback запросов
    this.bot.on("callback_query", this.handleCallbackQuery.bind(this));
  }

  /**
   * Обработка обновлений (для webhook и polling режимов)
   */
  private async processUpdate(update: any) {
    const updateId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    try {
      console.warn(`[Bot Update ${updateId}] 🚀 Processing update`, {
        updateId: update.update_id,
        updateType: Object.keys(update).filter(key => key !== 'update_id')[0],
        timestamp: new Date().toISOString(),
        botMode: this.isRunning ? 'running' : 'stopped',
        hasRealBot: !!this.bot
      });

      // Детальное логирование обновления
      if (update.message) {
        console.warn(`[Bot Update ${updateId}] 💬 Message received:`, {
          messageId: update.message.message_id,
          from: {
            id: update.message.from?.id,
            username: update.message.from?.username,
            firstName: update.message.from?.first_name
          },
          chat: {
            id: update.message.chat?.id,
            type: update.message.chat?.type
          },
          text: update.message.text,
          hasPhoto: !!update.message.photo,
          hasDocument: !!update.message.document
        });
      }

      // Если есть реальный бот (Telegraf), используем его
      if (this.bot) {
        console.warn(`[Bot Update ${updateId}] 🤖 Using Telegraf bot for processing`);
        const processStartTime = Date.now();
        
        await this.bot.handleUpdate(update);
        
        const processTime = Date.now() - processStartTime;
        console.warn(`[Bot Update ${updateId}] ✅ Telegraf processing completed in ${processTime}ms`);
      } else {
        // Fallback на мок обработку
        console.warn(`[Bot Update ${updateId}] 🔧 Using fallback mock processing`);
        const ctx = await this.createMockContext(update);

        // Определяем тип обработки
        let handlerType = 'unknown';
        const handlerStartTime = Date.now();
        
        // Обработка команд
        if (ctx.message?.text?.startsWith("/")) {
          handlerType = 'command';
          console.warn(`[Bot Update ${updateId}] ⚡ Handling command: ${ctx.message.text}`);
          await this.handleCommand(ctx);
        }
        // Обработка фотографий
        else if (ctx.message?.photo) {
          handlerType = 'photo';
          console.warn(`[Bot Update ${updateId}] 📸 Handling photo upload`);
          await this.photoHandler.handlePhoto(ctx);
        }
        // Обработка текстовых сообщений
        else if (ctx.message?.text) {
          handlerType = 'text';
          console.warn(`[Bot Update ${updateId}] 💭 Handling text message: "${ctx.message.text}"`);
          await this.handleTextMessage(ctx);
        }
        // Обработка callback запросов
        else if (ctx.callbackQuery?.data) {
          handlerType = 'callback';
          console.warn(`[Bot Update ${updateId}] 🔘 Handling callback query: ${ctx.callbackQuery.data}`);
          await this.handleCallbackQuery(ctx);
        }
        
        const handlerTime = Date.now() - handlerStartTime;
        console.warn(`[Bot Update ${updateId}] ✅ ${handlerType} handler completed in ${handlerTime}ms`);
        
        // Сохраняем сессию после обработки (для мок режима)
        const userId = ctx.from?.id;
        if (userId) {
          await BotSessionService.updateSession(userId, ctx.session);
        }
      }

      const totalTime = Date.now() - startTime;
      console.warn(`[Bot Update ${updateId}] 🏁 Update processing completed successfully in ${totalTime}ms`);
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[Bot Update ${updateId}] 💥 Error processing update:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        updateData: JSON.stringify(update, null, 2),
        processingTime: totalTime,
        timestamp: new Date().toISOString()
      });
      
      // Попытка отправить сообщение об ошибке пользователю
      if (update.message?.from?.id) {
        try {
          console.warn(`[Bot Update ${updateId}] 📤 Attempting to send error message to user`);
          // Здесь можно добавить отправку сообщения об ошибке
        } catch (replyError) {
          console.error(`[Bot Update ${updateId}] ❌ Failed to send error message:`, replyError);
        }
      }
    }
  }

  /**
   * Создание мок контекста для обработки
   */
  private async createMockContext(update: any): Promise<BotContext> {
    const userId = update.message?.from?.id || update.callback_query?.from?.id;
    let session: SessionData = { userId: userId?.toString() };
    
    // Пытаемся загрузить сессию из БД
    if (userId) {
      try {
        session = await BotSessionService.getSession(userId);
      } catch (error) {
        console.error('Error loading session for mock context:', error);
      }
    }
    
    return {
      from: update.message?.from || update.callback_query?.from,
      message: update.message,
      callbackQuery: update.callback_query,
      session,
      reply: async (text: string, options?: any) => {
        console.warn(`[Bot Reply] ${text}`);
        if (options) {
          console.warn(`[Bot Options]`, options);
        }
      },
      answerCbQuery: async (text?: string) => {
        console.warn(`[Bot Callback Answer] ${text || "OK"}`);
      },
      editMessageText: async (text: string, options?: any) => {
        console.warn(`[Bot Edit] ${text}`);
      },
      telegram: {
        getFile: async (fileId: string) => ({
          file_path: `mock_file_${fileId}`,
        }),
        getFileLink: async (fileId: string) => ({
          href: `https://mock.telegram.org/file/${fileId}`,
        }),
        sendMessage: async (userId: string, text: string) => {
          console.warn(`[Bot Send] To ${userId}: ${text}`);
        },
      },
    };
  }

  /**
   * Обработка команд
   */
  private async handleCommand(ctx: BotContext) {
    const command = ctx.message?.text?.split(" ")[0]?.substring(1); // убираем /

    switch (command) {
      case "start":
        await this.commands.start(ctx);
        break;
      case "help":
        await this.commands.help(ctx);
        break;
      case "register":
        await this.commands.registerTournament(ctx);
        break;
      case "result":
        await this.commands.addResult(ctx);
        break;
      case "stats":
        await this.commands.getStats(ctx);
        break;
      case "tournaments":
        await this.commands.listTournaments(ctx);
        break;
      case "settings":
        await this.commands.settings(ctx);
        break;
      default:
        await ctx.reply?.(
          "❓ Неизвестная команда. Используйте /help для справки.",
        );
    }
  }

  private async handleTextMessage(ctx: BotContext) {
    const text = ctx.message?.text;
    const session = ctx.session!;

    if (!text) {return;}

    // Если пользователь в процессе регистрации турнира
    if (session.currentAction === "register_tournament") {
      await this.commands.handleTournamentRegistration(ctx, text);
      return;
    }

    // Если пользователь добавляет результат
    if (session.currentAction === "add_result") {
      await this.commands.handleResultInput(ctx, text);
      return;
    }

    // Если пользователь редактирует данные турнира
    if (session.currentAction === "edit_tournament") {
      await this.commands.handleTournamentEdit(ctx, text);
      return;
    }

    // Обычное текстовое сообщение
    await ctx.reply?.(
      "🤖 Я не понимаю эту команду. Используйте /help для получения списка доступных команд.",
    );
  }

  private async handleCallbackQuery(ctx: BotContext) {
    if (!ctx.callbackQuery?.data) {return;}

    const data = ctx.callbackQuery.data;
    const [action, ...params] = data.split(":");

    switch (action) {
      case "tournament_select":
        await this.commands.selectTournament(ctx, params[0]);
        break;
      case "result_confirm":
        await this.commands.confirmResult(ctx, params[0]);
        break;
      case "notification_toggle":
        await this.commands.toggleNotification(ctx, params[0]);
        break;
      case "confirm_tournament":
        await this.photoHandler.confirmTournament(ctx);
        break;
      case "cancel_tournament":
        await this.photoHandler.cancelTournament(ctx);
        break;
      case "edit_tournament":
        await this.photoHandler.editTournament(ctx);
        break;
      default:
        await ctx.answerCbQuery?.("Неизвестная команда");
    }
  }

  /**
   * Запуск бота с проверкой режима из переменных окружения
   */
  public async start() {
    try {
      console.warn("🤖 Запуск Telegram бота...");

      if (this.isRunning) {
        console.warn("⚠️ Бот уже запущен");
        return;
      }

      // Читаем режим работы из переменных окружения
      const botMode = process.env.BOT_MODE || "polling";
      const webhookUrl = process.env.BOT_WEBHOOK_URL || "";
      const autoRestart = process.env.BOT_AUTO_RESTART === "true";

      console.warn(`🔧 Режим работы бота из .env: ${botMode}`);
      console.warn(`🔄 Автоперезапуск: ${autoRestart ? "включен" : "выключен"}`);

      if (webhookUrl) {
        console.warn(`🔗 Webhook URL: ${webhookUrl}`);
      }

      this.isRunning = true;

      // Синхронизируем настройки с БД (если доступна)
      try {
        await BotSettingsService.updateBotStatus("active");
        await BotSettingsService.updateSetting("bot_mode", botMode);
        await BotSettingsService.updateSetting("webhook_url", webhookUrl);
        await BotSettingsService.updateSetting(
          "auto_restart",
          autoRestart.toString(),
        );
        console.warn("📊 Настройки синхронизированы с БД");
      } catch (dbError) {
        console.warn("⚠️ БД недоступна, работаем автономно по .env настройкам");
      }

      // Запускаем в соответствующем режиме
      if (this.config.token && this.config.token !== "mock-bot-token") {
        if (botMode === "webhook" && webhookUrl) {
          console.warn("🔗 Запуск в webhook режиме...");
          await this.startWebhookMode(webhookUrl);
        } else if (botMode === "webhook" && !webhookUrl) {
          console.warn(
            "⚠️ Webhook режим выбран, но URL не настроен. Переключаемся на polling.",
          );
          console.warn("🔄 Запуск в polling режиме...");
          await this.startRealPolling();
        } else {
          console.warn("🔄 Запуск в polling режиме...");
          await this.startRealPolling();
        }
      } else {
        console.warn("🧪 Запуск в мок режиме...");
        await this.startMockPolling();
      }

      console.warn("✅ Telegram бот успешно запущен!");
    } catch (error) {
      console.error("❌ Ошибка запуска бота:", error);
      this.isRunning = false;

      // Обновляем статус ошибки в БД
      await BotSettingsService.updateBotStatus("error");
      await BotSettingsService.incrementErrorCount();

      throw error;
    }
  }

  /**
   * Запуск реального polling (когда есть токен)
   */
  private async startRealPolling() {
    if (!this.bot) {
      throw new Error("Bot not initialized with token");
    }

    try {
      console.warn("🔄 Запуск реального Telegram polling...");

      // Сначала проверим токен через getMe
      const me = await this.bot.telegram.getMe();
      console.warn(`✅ Бот подключен: @${me.username} (${me.first_name})`);

      // Запускаем бота в polling режиме
      console.warn("🚀 Вызываем bot.launch() с polling параметрами...");
      await this.bot.launch({
        polling: {
          timeout: 30,
          limit: 100,
          allowed_updates: ["message", "callback_query"],
        },
      });
      console.warn("🎯 bot.launch() завершен успешно");

      console.warn("✅ Реальный Telegram polling запущен!");

      // Проверяем, что бот действительно слушает обновления
      console.warn("👂 Бот готов принимать команды и сообщения");

      // Graceful shutdown
      process.once("SIGINT", () => this.bot?.stop("SIGINT"));
      process.once("SIGTERM", () => this.bot?.stop("SIGTERM"));
    } catch (error) {
      console.error("❌ Ошибка запуска реального polling:", error);

      if (error instanceof Error && error.message.includes("404")) {
        console.error("💡 Возможные причины:");
        console.error("   - Неверный токен бота");
        console.error("   - Бот был удален в BotFather");
        console.error("   - Проблемы с подключением к Telegram API");
        console.error("🔧 Переключаемся на мок режим...");

        // Переключаемся на мок режим
        this.bot = undefined;
        await this.startMockPolling();
        return;
      }

      throw error;
    }
  }

  /**
   * Запуск в webhook режиме
   */
  private async startWebhookMode(webhookUrl: string) {
    if (!this.bot) {
      throw new Error("Bot not initialized with token");
    }

    try {
      console.warn("🔗 Настройка webhook режима...");

      if (!webhookUrl) {
        throw new Error("Webhook URL not provided");
      }

      console.warn(`🎯 Настройка webhook: ${webhookUrl}`);

      // Устанавливаем webhook в Telegram
      const result = await this.bot.telegram.setWebhook(webhookUrl, {
        allowed_updates: ["message", "callback_query"],
      });

      if (result) {
        console.warn(`✅ Webhook установлен: ${webhookUrl}`);

        // Обновляем настройки в БД
        await BotSettingsService.updateSetting("webhook_enabled", true);
        await BotSettingsService.updateSetting("polling_enabled", false);
        await BotSettingsService.updateLastUpdateTime();

        console.warn("✅ Webhook режим активирован!");
      } else {
        throw new Error("Failed to set webhook");
      }
    } catch (error) {
      console.error("❌ Ошибка настройки webhook режима:", error);

      // Обновляем статус ошибки
      await BotSettingsService.updateBotStatus("error");
      await BotSettingsService.incrementErrorCount();

      throw error;
    }
  }

  /**
   * Запуск мок polling для разработки
   */
  private async startMockPolling() {
    console.warn("🧪 Мок polling запущен для разработки");

    // Имитация получения обновлений каждые 5 секунд
    this.pollingInterval = setInterval(() => {
      this.simulateUpdate();
    }, 30000); // каждые 30 секунд для демонстрации
  }

  /**
   * Симуляция обновления для демонстрации
   */
  private async simulateUpdate() {
    const mockUpdate = {
      update_id: Date.now(),
      message: {
        message_id: Math.floor(Math.random() * 1000),
        from: {
          id: 123456789,
          first_name: "Test",
          username: "testuser",
        },
        chat: {
          id: 123456789,
          type: "private",
        },
        date: Math.floor(Date.now() / 1000),
        text: "/stats",
      },
    };

    // Обрабатываем только раз в час для демонстрации
    if (Math.random() < 0.1) {
      console.warn("📱 Симуляция команды /stats от тестового пользователя");
      await this.processUpdate(mockUpdate);
    }
  }

  /**
   * Остановка бота
   */
  public async stop() {
    console.warn("🛑 Остановка Telegram бота...");

    this.isRunning = false;

    try {
      // Обновляем статус в БД
      await BotSettingsService.updateBotStatus("inactive");

      // Останавливаем реального бота если он есть
      if (this.bot) {
        try {
          // Проверяем текущий режим
          const botMode = await BotSettingsService.getBotMode();

          if (botMode === "webhook") {
            // Удаляем webhook
            console.warn("🔗 Удаление webhook...");
            await this.bot.telegram.deleteWebhook();
            await BotSettingsService.updateSetting("webhook_enabled", false);
            console.warn("✅ Webhook удален");
          }

          this.bot.stop();
          console.warn("✅ Реальный Telegram бот остановлен");
        } catch (error) {
          console.error("Ошибка остановки реального бота:", error);
          await BotSettingsService.incrementErrorCount();
        }
      }

      // Останавливаем мок polling
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = undefined;
        console.warn("✅ Мок polling остановлен");
      }

      console.warn("✅ Telegram бот полностью остановлен");
    } catch (error) {
      console.error("Ошибка остановки бота:", error);
      await BotSettingsService.updateBotStatus("error");
    }
  }

  /**
   * Получение статуса бота
   */
  public getStatus(): { status: string; mode: string; isRunning: boolean } {
    return {
      status: this.isRunning ? "active" : "inactive",
      mode: "polling",
      isRunning: this.isRunning,
    };
  }

  // Методы для отправки уведомлений
  public async sendNotification(userId: string, message: string) {
    try {
      if (this.bot) {
        // Отправляем через реального бота
        await this.bot.telegram.sendMessage(userId, message);
        console.warn(`[Real Bot Notification] Sent to ${userId}: ${message}`);
      } else {
        // Мок режим
        console.warn(`[Mock Bot Notification] To ${userId}: ${message}`);
      }
    } catch (error) {
      console.error("Ошибка отправки уведомления:", error);
    }
  }

  public async sendTournamentReminder(
    userId: string,
    tournamentName: string,
    date: string,
  ) {
    const message =
      `🎰 Напоминание о турнире!\n\n` +
      `📅 ${tournamentName}\n` +
      `⏰ ${date}\n\n` +
      `Удачи за столами! 🍀`;

    await this.sendNotification(userId, message);
  }

  /**
   * Обработка внешнего обновления (для API)
   */
  public async handleUpdate(update: any) {
    await this.processUpdate(update);
  }
}

// Экспорт для использования в API роутах
export { PokerTrackerBot };

// Создание экземпляра бота (будет использоваться в API)
let botInstance: PokerTrackerBot | null = null;

export function getBotInstance(): PokerTrackerBot | null {
  return botInstance;
}

export function createBotInstance(token?: string): PokerTrackerBot {
  if (botInstance) {
    return botInstance;
  }

  botInstance = new PokerTrackerBot(token);
  return botInstance;
}

/**
 * Автоматический запуск бота при импорте модуля
 */
export async function initializeBot() {
  if (!botInstance) {
    botInstance = new PokerTrackerBot();

    try {
      await botInstance.start();
    } catch (error) {
      console.error("Ошибка автоматического запуска бота:", error);
    }
  }

  return botInstance;
}
