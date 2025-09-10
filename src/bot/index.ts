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
import { Telegraf, Context } from 'telegraf'
import { message } from 'telegraf/filters'
import { BotCommands } from './commands'
import { PhotoHandler } from './handlers/photoHandler'
import { NotificationService } from './services/notificationService'
import { getBotConfig } from './config'

export interface SessionData {
  userId?: string
  currentAction?: string
  tournamentData?: any
  ocrData?: any
}

export interface BotContext extends Context {
  // Расширяем стандартный Context от Telegraf
  session: SessionData
}

class PokerTrackerBot {
  private config: any
  private commands: BotCommands
  private photoHandler: PhotoHandler
  private notificationService: NotificationService
  private isRunning: boolean = false
  private pollingInterval?: NodeJS.Timeout
  private bot?: Telegraf<BotContext>
  private sessions: Map<number, SessionData> = new Map()

  constructor(token?: string) {
    this.config = getBotConfig()
    this.commands = new BotCommands()
    this.photoHandler = new PhotoHandler()
    this.notificationService = new NotificationService()
    
    // Создаем бота если есть токен
    if (this.config.token && this.config.token !== 'mock-bot-token') {
      console.log('🔑 Инициализируем бота с реальным токеном:', this.config.token.substring(0, 10) + '...')
      this.bot = new Telegraf<BotContext>(this.config.token)
      console.log('📝 Настраиваем команды и обработчики...')
      this.setupBot()
      console.log('🤖 PokerTracker Bot инициализирован с реальным токеном')
    } else {
      console.log('🤖 PokerTracker Bot инициализирован в мок режиме')
    }
  }

  /**
   * Настройка реального Telegraf бота
   */
  private setupBot() {
    if (!this.bot) return

    // Middleware для сессий (простое хранилище в памяти)
    this.bot.use((ctx, next) => {
      const userId = ctx.from?.id
      if (!userId) return next()
      
      if (!this.sessions.has(userId)) {
        this.sessions.set(userId, {
          userId: userId.toString(),
          currentAction: undefined,
          tournamentData: undefined,
          ocrData: undefined
        })
      }
      
      ctx.session = this.sessions.get(userId)!
      return next()
    })

    // Логирование сообщений
    this.bot.use((ctx, next) => {
      const messageType = ctx.message ? 
        ('text' in ctx.message ? 'text' : 
         'photo' in ctx.message ? 'photo' : 
         'document' in ctx.message ? 'document' : 
         'other') : 'no-message'
      
      console.log(`[Real Bot] Message from ${ctx.from?.username || ctx.from?.id}: ${messageType}`)
      
      if (ctx.message && 'photo' in ctx.message) {
        console.log(`[Real Bot] Photo details: ${ctx.message.photo.length} sizes`)
      }
      
      return next()
    })

    // Команды с логированием
    this.bot.command('start', async (ctx) => {
      try {
        console.log('🤖 Получена команда /start')
        await this.commands.start(ctx)
      } catch (error) {
        console.error('❌ Ошибка при обработке команды /start:', error)
        await ctx.reply('❌ Произошла ошибка при обработке команды /start')
      }
    })
    this.bot.command('link', async (ctx) => {
      try {
        console.log('🤖 Получена команда /link')
        await this.commands.link(ctx)
      } catch (error) {
        console.error('❌ Ошибка при обработке команды /link:', error)
        await ctx.reply('❌ Произошла ошибка при обработке команды /link')
      }
    })
    this.bot.command('help', async (ctx) => {
      try {
        console.log('🤖 Получена команда /help')
        await this.commands.help(ctx)
      } catch (error) {
        console.error('❌ Ошибка при обработке команды /help:', error)
        await ctx.reply('❌ Произошла ошибка при обработке команды /help')
      }
    })
    this.bot.command('register', async (ctx) => {
      console.log('🤖 Получена команда /register')
      await this.commands.registerTournament(ctx)
    })
    this.bot.command('result', async (ctx) => {
      console.log('🤖 Получена команда /result')
      await this.commands.addResult(ctx)
    })
    this.bot.command('stats', async (ctx) => {
      console.log('🤖 Получена команда /stats')
      await this.commands.getStats(ctx)
    })
    this.bot.command('tournaments', async (ctx) => {
      console.log('🤖 Получена команда /tournaments')
      await this.commands.listTournaments(ctx)
    })
    this.bot.command('settings', async (ctx) => {
      console.log('🤖 Получена команда /settings')
      await this.commands.settings(ctx)
    })
    this.bot.command('venue', async (ctx) => {
      console.log('🤖 Получена команда /venue')
      await this.commands.showCurrentVenue(ctx)
    })
    this.bot.command('setvenue', async (ctx) => {
      console.log('🤖 Получена команда /setvenue')
      await this.commands.setCurrentVenue(ctx)
    })

    // Обработка фотографий
    this.bot.on(message('photo'), async (ctx) => {
      console.log('📸 Получена фотография от пользователя!')
      console.log('📸 Количество фото в сообщении:', ctx.message.photo.length)
      await this.photoHandler.handlePhoto(ctx)
    })

    // Обработка документов (включая фото, отправленные как файлы)
    this.bot.on(message('document'), async (ctx) => {
      console.log('📄 Получен документ от пользователя!')
      console.log('📄 MIME type:', ctx.message.document.mime_type)
      console.log('📄 Имя файла:', ctx.message.document.file_name)
      
      // Проверяем, является ли документ изображением
      if (ctx.message.document.mime_type?.startsWith('image/')) {
        console.log('📸 Документ является изображением, обрабатываем как фото')
        await this.photoHandler.handleDocumentAsPhoto(ctx)
      } else {
        await ctx.reply('📄 Я получил документ, но для обработки билетов турниров нужны изображения.\n\n' +
                       '💡 Попробуйте:\n' +
                       '• Отправить фото через камеру\n' +
                       '• Отправить изображение из галереи\n' +
                       '• Убедиться, что файл имеет формат JPG, PNG или другой формат изображения')
      }
    })

    // Обработка текстовых сообщений
    this.bot.on(message('text'), this.handleTextMessage.bind(this))

    // Обработка callback запросов
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this))
  }

  /**
   * Мок обработка сообщений в polling режиме
   */
  private async processUpdate(update: any) {
    try {
      const ctx = this.createMockContext(update)
      
      // Логирование сообщения
      console.log(`[Bot Polling] Обработка обновления:`, JSON.stringify(update, null, 2))
      
      // Обработка команд
      if (ctx.message?.text?.startsWith('/')) {
        await this.handleCommand(ctx)
      }
      // Обработка фотографий
      else if (ctx.message?.photo) {
        await this.photoHandler.handlePhoto(ctx)
      }
      // Обработка текстовых сообщений
      else if (ctx.message?.text) {
        await this.handleTextMessage(ctx)
      }
      // Обработка callback запросов
      else if (ctx.callbackQuery?.data) {
        await this.handleCallbackQuery(ctx)
      }
      
    } catch (error) {
      console.error('[Bot Polling] Ошибка обработки обновления:', error)
    }
  }

  /**
   * Создание мок контекста для обработки
   */
  private createMockContext(update: any): BotContext {
    return {
      from: update.message?.from || update.callback_query?.from,
      message: update.message,
      callbackQuery: update.callback_query,
      session: {},
      reply: async (text: string, options?: any) => {
        console.log(`[Bot Reply] ${text}`)
        if (options) {
          console.log(`[Bot Options]`, options)
        }
      },
      answerCbQuery: async (text?: string) => {
        console.log(`[Bot Callback Answer] ${text || 'OK'}`)
      },
      editMessageText: async (text: string, options?: any) => {
        console.log(`[Bot Edit] ${text}`)
      },
      telegram: {
        getFile: async (fileId: string) => ({ file_path: `mock_file_${fileId}` }),
        getFileLink: async (fileId: string) => ({ href: `https://mock.telegram.org/file/${fileId}` }),
        sendMessage: async (userId: string, text: string) => {
          console.log(`[Bot Send] To ${userId}: ${text}`)
        }
      }
    }
  }

  /**
   * Обработка команд
   */
  private async handleCommand(ctx: BotContext) {
    const command = ctx.message?.text?.split(' ')[0]?.substring(1) // убираем /
    
    switch (command) {
      case 'start':
        await this.commands.start(ctx)
        break
      case 'help':
        await this.commands.help(ctx)
        break
      case 'register':
        await this.commands.registerTournament(ctx)
        break
      case 'result':
        await this.commands.addResult(ctx)
        break
      case 'stats':
        await this.commands.getStats(ctx)
        break
      case 'tournaments':
        await this.commands.listTournaments(ctx)
        break
      case 'settings':
        await this.commands.settings(ctx)
        break
      default:
        await ctx.reply?.('❓ Неизвестная команда. Используйте /help для справки.')
    }
  }

  private async handleTextMessage(ctx: BotContext) {
    const text = ctx.message?.text
    const session = ctx.session!
    
    if (!text) return
    
    // Если пользователь в процессе регистрации турнира
    if (session.currentAction === 'register_tournament') {
      await this.commands.handleTournamentRegistration(ctx, text)
      return
    }
    
    // Если пользователь добавляет результат
    if (session.currentAction === 'add_result') {
      await this.commands.handleResultInput(ctx, text)
      return
    }
    
    // Если пользователь редактирует данные турнира
    if (session.currentAction === 'edit_tournament') {
      await this.commands.handleTournamentEdit(ctx, text)
      return
    }
    
    // Обычное текстовое сообщение
    await ctx.reply?.(
      '🤖 Я не понимаю эту команду. Используйте /help для получения списка доступных команд.'
    )
  }

  private async handleCallbackQuery(ctx: BotContext) {
    if (!ctx.callbackQuery?.data) return
    
    const data = ctx.callbackQuery.data
    const [action, ...params] = data.split(':')
    
    switch (action) {
      case 'tournament_select':
        await this.commands.selectTournament(ctx, params[0])
        break
      case 'result_confirm':
        await this.commands.confirmResult(ctx, params[0])
        break
      case 'notification_toggle':
        await this.commands.toggleNotification(ctx, params[0])
        break
      case 'confirm_tournament':
        await this.photoHandler.confirmTournament(ctx)
        break
      case 'cancel_tournament':
        await this.photoHandler.cancelTournament(ctx)
        break
      case 'edit_tournament':
        await this.photoHandler.editTournament(ctx)
        break
      default:
        await ctx.answerCbQuery?.('Неизвестная команда')
    }
  }

  /**
   * Запуск бота в polling режиме
   */
  public async start() {
    try {
      console.log('🤖 Запуск Telegram бота в polling режиме...')
      
      if (this.isRunning) {
        console.log('⚠️ Бот уже запущен')
        return
      }

      this.isRunning = true
      
      // В реальном приложении здесь был бы запуск polling
      if (this.config.token && this.config.token !== 'mock-bot-token') {
        await this.startRealPolling()
      } else {
        await this.startMockPolling()
      }
      
      console.log('✅ Telegram бот успешно запущен в polling режиме!')
      
    } catch (error) {
      console.error('❌ Ошибка запуска бота:', error)
      this.isRunning = false
      throw error
    }
  }

  /**
   * Запуск реального polling (когда есть токен)
   */
  private async startRealPolling() {
    if (!this.bot) {
      throw new Error('Bot not initialized with token')
    }

    try {
      console.log('🔄 Запуск реального Telegram polling...')
      
      // Сначала проверим токен через getMe
      const me = await this.bot.telegram.getMe()
      console.log(`✅ Бот подключен: @${me.username} (${me.first_name})`)
      
      // Запускаем бота в polling режиме
      console.log('🚀 Вызываем bot.launch() с polling параметрами...')
      await this.bot.launch({
        polling: {
          timeout: 30,
          limit: 100,
          allowed_updates: ['message', 'callback_query']
        }
      })
      console.log('🎯 bot.launch() завершен успешно')
      
      console.log('✅ Реальный Telegram polling запущен!')
      
      // Проверяем, что бот действительно слушает обновления
      console.log('👂 Бот готов принимать команды и сообщения')

      // Graceful shutdown
      process.once('SIGINT', () => this.bot?.stop('SIGINT'))
      process.once('SIGTERM', () => this.bot?.stop('SIGTERM'))
      
    } catch (error) {
      console.error('❌ Ошибка запуска реального polling:', error)
      
      if (error instanceof Error && error.message.includes('404')) {
        console.error('💡 Возможные причины:')
        console.error('   - Неверный токен бота')
        console.error('   - Бот был удален в BotFather')
        console.error('   - Проблемы с подключением к Telegram API')
        console.error('🔧 Переключаемся на мок режим...')
        
        // Переключаемся на мок режим
        this.bot = undefined
        await this.startMockPolling()
        return
      }
      
      throw error
    }
  }

  /**
   * Запуск мок polling для разработки
   */
  private async startMockPolling() {
    console.log('🧪 Мок polling запущен для разработки')
    
    // Имитация получения обновлений каждые 5 секунд
    this.pollingInterval = setInterval(() => {
      this.simulateUpdate()
    }, 30000) // каждые 30 секунд для демонстрации
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
          first_name: 'Test',
          username: 'testuser'
        },
        chat: {
          id: 123456789,
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: '/stats'
      }
    }
    
    // Обрабатываем только раз в час для демонстрации
    if (Math.random() < 0.1) {
      console.log('📱 Симуляция команды /stats от тестового пользователя')
      await this.processUpdate(mockUpdate)
    }
  }

  /**
   * Остановка бота
   */
  public async stop() {
    console.log('🛑 Остановка Telegram бота...')
    
    this.isRunning = false
    
    // Останавливаем реального бота если он есть
    if (this.bot) {
      try {
        this.bot.stop()
        console.log('✅ Реальный Telegram бот остановлен')
      } catch (error) {
        console.error('Ошибка остановки реального бота:', error)
      }
    }
    
    // Останавливаем мок polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = undefined
      console.log('✅ Мок polling остановлен')
    }
    
    console.log('✅ Telegram бот полностью остановлен')
  }

  /**
   * Получение статуса бота
   */
  public getStatus(): { status: string; mode: string; isRunning: boolean } {
    return {
      status: this.isRunning ? 'active' : 'inactive',
      mode: 'polling',
      isRunning: this.isRunning
    }
  }

  // Методы для отправки уведомлений
  public async sendNotification(userId: string, message: string) {
    try {
      if (this.bot) {
        // Отправляем через реального бота
        await this.bot.telegram.sendMessage(userId, message)
        console.log(`[Real Bot Notification] Sent to ${userId}: ${message}`)
      } else {
        // Мок режим
        console.log(`[Mock Bot Notification] To ${userId}: ${message}`)
      }
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error)
    }
  }

  public async sendTournamentReminder(userId: string, tournamentName: string, date: string) {
    const message = `🎰 Напоминание о турнире!\n\n` +
                   `📅 ${tournamentName}\n` +
                   `⏰ ${date}\n\n` +
                   `Удачи за столами! 🍀`
    
    await this.sendNotification(userId, message)
  }

  /**
   * Обработка внешнего обновления (для API)
   */
  public async handleUpdate(update: any) {
    await this.processUpdate(update)
  }
}

// Экспорт для использования в API роутах
export { PokerTrackerBot }

// Создание экземпляра бота (будет использоваться в API)
let botInstance: PokerTrackerBot | null = null

export function getBotInstance(): PokerTrackerBot | null {
  return botInstance
}

export function createBotInstance(token?: string): PokerTrackerBot {
  if (botInstance) {
    return botInstance
  }
  
  botInstance = new PokerTrackerBot(token)
  return botInstance
}

/**
 * Автоматический запуск бота при импорте модуля
 */
export async function initializeBot() {
  if (!botInstance) {
    botInstance = new PokerTrackerBot()
    
    try {
      await botInstance.start()
    } catch (error) {
      console.error('Ошибка автоматического запуска бота:', error)
    }
  }
  
  return botInstance
}
