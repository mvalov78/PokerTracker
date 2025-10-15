/**
 * Сервис уведомлений для Telegram бота
 */

import { getTournamentsByUser, calculateUserStats } from "../../data/mockData";

export interface NotificationSettings {
  userId: string;
  reminders: boolean;
  weeklyStats: boolean;
  achievements: boolean;
  tournamentStart: boolean;
  results: boolean;
}

export class NotificationService {
  private settings: Map<string, NotificationSettings> = new Map();

  /**
   * Получение настроек уведомлений пользователя
   */
  getUserSettings(userId: string): NotificationSettings {
    return (
      this.settings.get(userId) || {
        userId,
        reminders: true,
        weeklyStats: true,
        achievements: true,
        tournamentStart: true,
        results: true,
      }
    );
  }

  /**
   * Обновление настроек уведомлений
   */
  updateUserSettings(userId: string, settings: Partial<NotificationSettings>) {
    const current = this.getUserSettings(userId);
    const updated = { ...current, ...settings };
    this.settings.set(userId, updated);
  }

  /**
   * Переключение типа уведомлений
   */
  toggleNotification(
    userId: string,
    type: keyof NotificationSettings,
  ): boolean {
    const settings = this.getUserSettings(userId);
    if (type === "userId") return false;

    const newValue = !settings[type];
    this.updateUserSettings(userId, { [type]: newValue });
    return newValue;
  }

  /**
   * Создание напоминания о предстоящем турнире
   */
  createTournamentReminder(
    tournamentName: string,
    date: Date,
    venue?: string,
  ): string {
    const dateStr = date.toLocaleDateString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return `
🎰 **Напоминание о турнире!**

📅 **${tournamentName}**
⏰ ${dateStr}
${venue ? `🏨 ${venue}` : ""}

🎯 **Подготовка к турниру:**
• Проверьте банкролл
• Изучите структуру
• Настройтесь на игру

Удачи за столами! 🍀
    `.trim();
  }

  /**
   * Создание уведомления о начале турнира
   */
  createTournamentStartNotification(tournamentName: string): string {
    return `
🚀 **Турнир начинается!**

🎰 **${tournamentName}**

⚡ **Время играть:**
• Сосредоточьтесь на игре
• Следите за стеками
• Адаптируйтесь к структуре

Покажите свой лучший покер! 💪
    `.trim();
  }

  /**
   * Создание еженедельного отчета
   */
  createWeeklyStatsReport(userId: string): string {
    const stats = calculateUserStats(userId);
    const tournaments = getTournamentsByUser(userId);

    // Фильтруем турниры за последнюю неделю
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyTournaments = tournaments.filter(
      (t) => new Date(t.date) >= weekAgo && t.result,
    );

    if (weeklyTournaments.length === 0) {
      return `
📊 **Еженедельный отчет**

На этой неделе вы не играли турниры.

🎯 **Совет:** Регулярная игра поможет улучшить результаты!
      `.trim();
    }

    const weeklyStats = {
      tournaments: weeklyTournaments.length,
      totalBuyin: weeklyTournaments.reduce((sum, t) => sum + t.buyin, 0),
      totalWinnings: weeklyTournaments.reduce(
        (sum, t) => sum + (t.result?.payout || 0),
        0,
      ),
      bestPosition: Math.min(
        ...weeklyTournaments.map((t) => t.result?.position || Infinity),
      ),
      itmCount: weeklyTournaments.filter((t) => (t.result?.payout || 0) > 0)
        .length,
    };

    const weeklyProfit = weeklyStats.totalWinnings - weeklyStats.totalBuyin;
    const weeklyROI =
      weeklyStats.totalBuyin > 0
        ? (weeklyProfit / weeklyStats.totalBuyin) * 100
        : 0;
    const itmRate =
      weeklyStats.tournaments > 0
        ? (weeklyStats.itmCount / weeklyStats.tournaments) * 100
        : 0;

    const profitText =
      weeklyProfit > 0 ? `+$${weeklyProfit}` : `-$${Math.abs(weeklyProfit)}`;
    const roiText =
      weeklyROI > 0 ? `+${weeklyROI.toFixed(1)}%` : `${weeklyROI.toFixed(1)}%`;

    return `
📊 **Еженедельный отчет**

🎰 **Турниры:** ${weeklyStats.tournaments}
💵 **Бай-ин:** $${weeklyStats.totalBuyin}
💰 **Выигрыш:** $${weeklyStats.totalWinnings}
📈 **Прибыль:** ${profitText}
📊 **ROI:** ${roiText}
🏆 **ITM Rate:** ${itmRate.toFixed(1)}%
🥇 **Лучшее место:** ${weeklyStats.bestPosition === Infinity ? "Нет" : weeklyStats.bestPosition}

**Общая статистика:**
🎯 Всего турниров: ${stats.totalTournaments}
💎 Общий ROI: ${stats.roi > 0 ? `+${stats.roi.toFixed(1)}%` : `${stats.roi.toFixed(1)}%`}

${weeklyROI > 0 ? "🚀 Отличная неделя!" : "💪 Продолжайте работать над игрой!"}
    `.trim();
  }

  /**
   * Создание уведомления о достижении
   */
  createAchievementNotification(
    achievement: string,
    description: string,
  ): string {
    const achievements = {
      first_win: "🏆 Первая победа!",
      profit_milestone: "💰 Рубеж прибыли!",
      roi_milestone: "📈 ROI рекорд!",
      tournament_streak: "🔥 Серия турниров!",
      itm_streak: "🎯 ITM серия!",
      big_win: "💎 Крупный выигрыш!",
      volume_milestone: "📊 Объем игры!",
    };

    const title =
      achievements[achievement as keyof typeof achievements] ||
      "🎉 Достижение!";

    return `
🎉 **Новое достижение разблокировано!**

${title}

${description}

Продолжайте в том же духе! 🚀
    `.trim();
  }

  /**
   * Создание уведомления о необходимости добавить результат
   */
  createResultReminderNotification(
    tournamentName: string,
    daysAgo: number,
  ): string {
    return `
⏰ **Напоминание о результате**

🎰 **${tournamentName}**
📅 Прошло дней: ${daysAgo}

Не забудьте добавить результат турнира!
Используйте команду /result

📊 Актуальная статистика поможет отслеживать прогресс.
    `.trim();
  }

  /**
   * Создание уведомления о предстоящих турнирах
   */
  createUpcomingTournamentsNotification(tournaments: any[]): string {
    if (tournaments.length === 0) {
      return `
📅 **Предстоящие турниры**

У вас нет запланированных турниров.

🎯 Зарегистрируйтесь на турниры и добавьте их через /register
    `.trim();
    }

    let message = "📅 **Предстоящие турниры**\n\n";

    tournaments.slice(0, 5).forEach((tournament, index) => {
      const date = new Date(tournament.date);
      const dateStr = date.toLocaleDateString("ru-RU");
      const timeStr = date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });

      message += `${index + 1}. **${tournament.name}**\n`;
      message += `   📅 ${dateStr} в ${timeStr}\n`;
      message += `   💵 $${tournament.buyin} | 🏨 ${tournament.venue}\n\n`;
    });

    message += "Удачи в предстоящих играх! 🍀";

    return message.trim();
  }

  /**
   * Проверка необходимости отправки уведомлений
   */
  shouldSendNotification(
    userId: string,
    type: keyof NotificationSettings,
  ): boolean {
    const settings = this.getUserSettings(userId);
    return settings[type] as boolean;
  }

  /**
   * Планирование уведомлений
   */
  scheduleNotifications(userId: string) {
    // В реальном приложении здесь была бы логика планирования уведомлений
    // через cron jobs или другие планировщики
    console.log(`Планирование уведомлений для пользователя ${userId}`);
  }

  /**
   * Отправка тестового уведомления
   */
  createTestNotification(): string {
    return `
🧪 **Тестовое уведомление**

Уведомления настроены и работают корректно!

🔔 Вы будете получать:
• Напоминания о турнирах
• Еженедельную статистику  
• Уведомления о достижениях

⚙️ Настройте уведомления через /settings
    `.trim();
  }
}
