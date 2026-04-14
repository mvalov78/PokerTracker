/**
 * Команды Telegram бота для PokerTracker Pro
 */

import { UserSettingsService } from "@/services/userSettingsService";
import { type Tournament } from "../types";
import type { BotContext } from "./index";

/**
 * Получить API URL для текущего окружения
 */
function getApiUrl(): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  // Если URL начинается с http/https - используем как есть
  if (appUrl.startsWith("http")) {
    return appUrl;
  }

  // Иначе добавляем https протокол (для Vercel URL)
  return `https://${appUrl}`;
}

/** Значение position в БД, когда введён только выигрыш (место не указывали). В схеме position > 0. */
const POSITION_UNKNOWN = 999;

export class BotCommands {
  /**
   * Команда /start - приветствие и инструкции
   */
  async start(ctx: BotContext) {
    const welcomeMessage = `
🎰 **Добро пожаловать в PokerTracker Pro Bot!**

Я помогу вам отслеживать результаты турниров по покеру:

🔹 Регистрируйте турниры через фото билета
🔹 Добавляйте результаты быстро и удобно  
🔹 Получайте статистику и аналитику
🔹 Настраивайте уведомления

**Основные команды:**
/link - Связать с веб-аккаунтом
/register - Зарегистрировать новый турнир
/result - Добавить результат турнира
/tournaments - Список ваших турниров
/stats - Ваша статистика
/venue - Текущая площадка
/setvenue <название> - Установить площадку
/settings - Настройки уведомлений
/help - Справка по командам

**Быстрый старт:**
1️⃣ Установите площадку: \`/setvenue PokerStars Live\`
2️⃣ Отправьте фото билета турнира
3️⃣ Дополните информацию при необходимости
4️⃣ После турнира добавьте результат

Удачи за столами! 🍀
    `;

    await ctx.reply(welcomeMessage, { parse_mode: "Markdown" });
  }

  /**
   * Команда /link - связывание с веб-аккаунтом
   */
  async link(ctx: BotContext) {
    try {
      const args = ctx.message?.text?.split(" ").slice(1) || [];
      const linkingCode = args[0];

      if (!linkingCode) {
        const helpMessage = `
🔗 **Связывание с веб-аккаунтом**

Для связывания вашего Telegram с веб-аккаунтом:

1️⃣ Перейдите на сайт PokerTracker
2️⃣ Зайдите в Настройки → Telegram
3️⃣ Нажмите "Создать код связывания"
4️⃣ Отправьте мне команду: \`/link КОД\`

**Пример:** \`/link ABC123XY\`

После связывания все турниры, созданные через бот, будут автоматически привязаны к вашему веб-аккаунту! 🎯
        `;

        await ctx.reply(helpMessage, { parse_mode: "Markdown" });
        return;
      }

      const telegramId = ctx.from?.id;
      if (!telegramId) {
        await ctx.reply("❌ Не удалось получить ваш Telegram ID");
        return;
      }

      // Отправляем запрос к API для связывания
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/telegram/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: telegramId.toString(),
          linkingCode: linkingCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const successMessage = `
✅ **Аккаунты успешно связаны!**

🎭 **Пользователь:** ${result.user.username}
🆔 **Telegram ID:** ${telegramId}

Теперь все турниры, созданные через бот, будут автоматически привязаны к вашему веб-аккаунту.

🎯 **Что дальше?**
• Отправьте фото билета для создания турнира
• Используйте /tournaments для просмотра турниров
• Настройте уведомления через /settings

Добро пожаловать в PokerTracker Pro! 🚀
        `;

        await ctx.reply(successMessage, { parse_mode: "Markdown" });
      } else {
        let errorMessage = "❌ **Ошибка связывания аккаунтов**\n\n";

        switch (result.error) {
          case "Invalid linking code":
            errorMessage +=
              "🔍 **Неверный код связывания**\n\nПроверьте правильность кода и попробуйте снова.";
            break;
          case "Linking code has expired":
            errorMessage +=
              "⏰ **Код связывания истек**\n\nСоздайте новый код в веб-интерфейсе.";
            break;
          case "Linking code has already been used":
            errorMessage +=
              "🔄 **Код уже использован**\n\nСоздайте новый код для связывания.";
            break;
          case "This Telegram account is already linked to another user":
            errorMessage +=
              "👥 **Аккаунт уже привязан**\n\nЭтот Telegram уже связан с другим пользователем.";
            break;
          default:
            errorMessage += `💥 **Техническая ошибка:** ${result.error}`;
            break;
        }

        errorMessage += "\n\n💡 **Что делать:**\n";
        errorMessage += "• Проверьте правильность кода\n";
        errorMessage += "• Создайте новый код в веб-интерфейсе\n";
        errorMessage += "• Обратитесь к администратору при повторных ошибках";

        await ctx.reply(errorMessage, { parse_mode: "Markdown" });
      }
    } catch (error) {
      console.error("Error in link command:", error);
      await ctx.reply(
        "❌ Произошла ошибка при связывании аккаунтов. Попробуйте позже.",
      );
    }
  }

  /**
   * Команда /help - справка по командам
   */
  async help(ctx: BotContext) {
    console.warn("📖 Выполняется команда help(), отправляем справку...");

    const helpMessage = `
🤖 **Справка по командам PokerTracker Pro Bot**

**📝 Регистрация турниров:**
/register - Начать регистрацию турнира
📷 Отправить фото билета - Автоматическая регистрация

**📊 Результаты:**
/result - Добавить результат турнира
/tournaments - Список всех турниров

**📈 Статистика:**
/stats - Общая статистика игры

**🏨 Управление площадками:**
/venue - Показать текущую площадку
/setvenue <название> - Установить площадку для новых турниров

**⚙️ Настройки:**
/settings - Настройки уведомлений

**🔍 Дополнительно:**
/start - Главное меню
/help - Эта справка

**💡 Советы:**
• Фотографируйте билеты четко и полностью
• Установите площадку один раз: \`/setvenue PokerStars Live\`
• Добавляйте результаты сразу после турнира
• Используйте уведомления для напоминаний
    `;

    try {
      console.warn("📤 Отправляем справочное сообщение пользователю...");
      await ctx.reply(helpMessage, { parse_mode: "Markdown" });
      console.warn("✅ Справочное сообщение успешно отправлено");
    } catch (error) {
      console.error("❌ Ошибка при отправке справочного сообщения:", error);
      // Попробуем отправить без markdown
      try {
        await ctx.reply(
          "🤖 Справка по командам PokerTracker Pro Bot\n\n/start - Главное меню\n/help - Эта справка\n/register - Регистрация турнира\n/result - Добавить результат\n/stats - Статистика\n/tournaments - Список турниров\n/venue - Текущая площадка\n/setvenue <название> - Установить площадку\n/settings - Настройки",
        );
        console.warn("✅ Упрощенная справка отправлена");
      } catch (simpleError) {
        console.error(
          "❌ Ошибка при отправке упрощенной справки:",
          simpleError,
        );
      }
    }
  }

  /**
   * Команда /register - начать регистрацию турнира
   */
  async registerTournament(ctx: BotContext) {
    ctx.session!.currentAction = "register_tournament";
    ctx.session!.tournamentData = {};

    const message = `
🎰 **Регистрация нового турнира**

Отправьте мне фото билета турнира, и я автоматически извлеку информацию.

Или введите данные вручную в формате:
\`Название турнира | Дата (ДД.ММ.ГГГГ) | Бай-ин | Площадка\`
или
\`Название турнира - Дата (ДД.ММ.ГГГГ) - Бай-ин - Площадка\`

**Пример:**
\`Sunday Special | 15.12.2024 | 500 | Aria Casino\`
\`Sunday Special - 15.12.2024 - 500 - Aria Casino\`

Для отмены введите /cancel
    `;

    await ctx.reply(message, { parse_mode: "Markdown" });
  }

  /**
   * Обработка ввода данных турнира
   */
  async handleTournamentRegistration(ctx: BotContext, text: string) {
    if (text === "/cancel") {
      ctx.session!.currentAction = undefined;
      ctx.session!.tournamentData = undefined;
      await ctx.reply("❌ Регистрация турнира отменена.");
      return;
    }

    try {
      // Улучшенная логика разбора с поддержкой разных разделителей
      let parts: string[] = [];

      // Определяем разделитель и разбиваем строку
      if (text.includes(" | ")) {
        parts = text.split(" | ");
      } else if (text.includes("|")) {
        parts = text.split("|").map((p) => p.trim());
      } else if (text.includes(" - ")) {
        parts = text.split(" - ");
      } else if (text.includes(" – ")) {
        parts = text.split(" – ");
      } else if (text.includes(" — ")) {
        parts = text.split(" — ");
      }

      // Убираем лишние пробелы
      parts = parts.map((p) => p.trim()).filter((p) => p.length > 0);

      if (parts.length < 4) {
        await ctx.reply(
          "❌ Неверный формат. Используйте:\n" +
            "`Название | Дата | Бай-ин | Площадка` или\n" +
            "`Название - Дата - Бай-ин - Площадка`",
          { parse_mode: "Markdown" },
        );
        return;
      }

      const [name, dateStr, buyinStr, venue] = parts;
      const buyin = parseFloat(buyinStr);

      if (isNaN(buyin)) {
        await ctx.reply("❌ Бай-ин должен быть числом (например: 500)");
        return;
      }

      // Парсим дату
      const dateParts = dateStr.split(".");
      if (dateParts.length !== 3) {
        await ctx.reply("❌ Дата должна быть в формате ДД.ММ.ГГГГ");
        return;
      }

      const [day, month, year] = dateParts.map((p) => parseInt(p));
      const date = new Date(year, month - 1, day);

      if (isNaN(date.getTime())) {
        await ctx.reply("❌ Неверная дата");
        return;
      }

      // Создаем турнир
      const tournamentData: Partial<Tournament> = {
        name,
        date: date.toISOString(),
        buyin,
        venue,
        tournamentType: "freezeout", // По умолчанию
        structure: "NL Hold'em",
      };

      const userId = ctx.from?.id.toString() || "user-1";
      const newTournament = addTournament(tournamentData, userId);

      // Сбрасываем состояние
      ctx.session!.currentAction = undefined;
      ctx.session!.tournamentData = undefined;

      const successMessage = `
✅ **Турнир успешно зарегистрирован!**

🎰 **${newTournament.name}**
📅 ${new Date(newTournament.date).toLocaleDateString("ru-RU")}
💵 Бай-ин: $${newTournament.buyin}
🏨 ${newTournament.venue}

ID турнира: \`${newTournament.id}\`

После турнира используйте /result для добавления результата.
      `;

      await ctx.reply(successMessage, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Ошибка регистрации турнира:", error);
      await ctx.reply("❌ Ошибка при регистрации турнира. Попробуйте еще раз.");
    }
  }

  /**
   * Команда /result - добавить результат турнира
   */
  async addResult(ctx: BotContext) {
    try {
      const userId = ctx.from?.id.toString() || "user-1";

      // Получаем турниры через API
      const apiUrl = getApiUrl();
      const apiResponse = await fetch(
        `${apiUrl}/api/tournaments?userId=${userId}`,
      );
      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }

      const apiResult = await apiResponse.json();
      if (!apiResult.success) {
        throw new Error("Failed to fetch tournaments via API");
      }

      const tournaments = apiResult.tournaments;

      console.warn(
        "[BOT addResult] Всего турниров получено:",
        tournaments.length,
      );

      // Фильтруем турниры без результатов
      // Проверяем и tournament_results (объект/массив), и result (fallback)
      const tournamentsWithoutResults = tournaments.filter((t: any) => {
        console.warn("[BOT addResult] Проверяем турнир:", {
          name: t.name,
          id: t.id,
          has_result_field: !!t.result,
          tournament_results_type: typeof t.tournament_results,
          tournament_results_value: t.tournament_results,
          is_array: Array.isArray(t.tournament_results),
        });

        // Проверяем наличие результата более строго
        const hasResult = !!(
          (
            t.result ||
            (Array.isArray(t.tournament_results) &&
              t.tournament_results.length > 0) ||
            (t.tournament_results &&
              typeof t.tournament_results === "object" &&
              !Array.isArray(t.tournament_results) &&
              t.tournament_results !== null &&
              Object.keys(t.tournament_results).length > 0)
          ) // Проверяем, что объект не пустой
        );

        console.warn(
          "[BOT addResult]",
          hasResult
            ? "✅ Есть результат (пропускаем)"
            : "❌ Нет результата (показываем)",
          t.name,
        );

        return !hasResult;
      });

      console.warn(
        "[BOT addResult] Турниров без результатов:",
        tournamentsWithoutResults.length,
      );

      if (tournamentsWithoutResults.length === 0) {
        await ctx.reply("📝 У вас нет турниров без результатов.");
        return;
      }

      const message = "🏆 **Выберите турнир для добавления результата:**\n\n";

      const keyboard = tournamentsWithoutResults
        .slice(0, 10)
        .map((tournament) => [
          {
            text: `🎰 ${tournament.name} ($${tournament.buyin})`,
            callback_data: `tournament_select:${tournament.id}`,
          },
        ]);

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard },
      });
    } catch (error) {
      console.error("Ошибка получения турниров:", error);
      await ctx.reply("❌ Ошибка получения списка турниров.");
    }
  }

  /**
   * Выбор турнира для добавления результата
   */
  async selectTournament(ctx: BotContext, tournamentId: string) {
    console.log("[BOT selectTournament] Турнир выбран:", tournamentId);
    console.log("[BOT selectTournament] Сессия до изменения:", ctx.session);

    ctx.session!.currentAction = "add_result";
    ctx.session!.tournamentData = { tournamentId };

    console.log("[BOT selectTournament] Сессия после изменения:", ctx.session);
    console.log(
      "[BOT selectTournament] currentAction установлен:",
      ctx.session!.currentAction,
    );
    console.log(
      "[BOT selectTournament] tournamentData установлен:",
      ctx.session!.tournamentData,
    );

    await ctx.answerCbQuery();

    const message = `
🏆 **Добавление результата турнира**

Введите результат одним из способов:

**Только выигрыш** (место не важно):
\`2500\` или \`0\`

**Место и выигрыш:** \`Место | Выигрыш\` или \`Место - Выигрыш\`
\`1 | 2500\` - 1 место, $2500
\`15 - 0\` - 15 место, без призовых
\`3 | 850\` - 3 место, $850

Для отмены введите /cancel
    `;

    await ctx.reply(message, { parse_mode: "Markdown" });
    console.log("[BOT selectTournament] Сообщение отправлено пользователю");
  }

  /**
   * Обработка ввода результата
   */
  async handleResultInput(ctx: BotContext, text: string) {
    if (text === "/cancel") {
      ctx.session!.currentAction = undefined;
      ctx.session!.tournamentData = undefined;
      await ctx.reply("❌ Добавление результата отменено.");
      return;
    }

    try {
      // Улучшенная логика разбора с поддержкой разных разделителей
      let parts: string[] = [];

      // Сначала пробуем разделить по " | " (вертикальная черта с пробелами)
      if (text.includes(" | ")) {
        parts = text.split(" | ");
      }
      // Затем пробуем по "|" без пробелов
      else if (text.includes("|")) {
        parts = text.split("|").map((p) => p.trim());
      }
      // Затем пробуем по " - " (дефис с пробелами)
      else if (text.includes(" - ")) {
        parts = text.split(" - ");
      }
      // Затем пробуем по " – " (en-dash с пробелами)
      else if (text.includes(" – ")) {
        parts = text.split(" – ");
      }
      // Затем пробуем по " — " (em-dash с пробелами)
      else if (text.includes(" — ")) {
        parts = text.split(" — ");
      }
      // По пробелу (формат "15 0")
      else if (text.includes(" ")) {
        parts = text.split(/\s+/).filter((p) => p.length > 0);
      }
      // Нет разделителя — вся строка как одна часть (только выигрыш)
      else if (text.trim().length > 0) {
        parts = [text.trim()];
      }

      // Убираем лишние пробелы
      parts = parts.map((p) => p.trim()).filter((p) => p.length > 0);

      let position: number;
      let payout: number;

      if (parts.length === 1) {
        // Только выигрыш — место не указываем (только цифры и точка)
        const payoutStr = parts[0];
        if (/[,]/.test(payoutStr)) {
          await ctx.reply(
            "❌ Неверный формат. Введите только выигрыш (например `2500`) или `Место | Выигрыш` / `Место - Выигрыш`",
            { parse_mode: "Markdown" },
          );
          return;
        }
        payout = parseFloat(payoutStr);
        if (isNaN(payout) || payout < 0) {
          await ctx.reply("❌ Выигрыш должен быть числом (0 или больше)");
          return;
        }
        position = POSITION_UNKNOWN;
      } else if (parts.length === 2) {
        const [positionStr, payoutStr] = parts;
        position = parseInt(positionStr);
        payout = parseFloat(payoutStr);

        if (isNaN(position) || position < 1) {
          await ctx.reply("❌ Место должно быть положительным числом");
          return;
        }

        if (isNaN(payout) || payout < 0) {
          await ctx.reply("❌ Выигрыш должен быть числом (0 или больше)");
          return;
        }
      } else {
        await ctx.reply(
          "❌ Неверный формат. Введите только выигрыш (например `2500`) или `Место | Выигрыш` / `Место - Выигрыш`",
          { parse_mode: "Markdown" },
        );
        return;
      }

      const tournamentId = ctx.session!.tournamentData.tournamentId;

      // Добавляем результат
      // Добавляем результат через API
      const resultData = {
        position,
        payout,
        notes: "Добавлено через Telegram бота",
      };

      console.log("[BOT] Подготовка к отправке результата:", {
        tournamentId,
        position,
        payout,
        resultData,
      });

      // Получаем турнир и обновляем его с результатом через API
      const apiUrl = getApiUrl();
      const requestUrl = `${apiUrl}/api/tournaments/${tournamentId}`;

      console.log("[BOT] API URL:", apiUrl);
      console.log("[BOT] Request URL:", requestUrl);
      console.log(
        "[BOT] Request body:",
        JSON.stringify({ result: resultData }, null, 2),
      );

      const updateResponse = await fetch(requestUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result: resultData,
        }),
      });

      console.log("[BOT] Response status:", updateResponse.status);
      console.log("[BOT] Response ok:", updateResponse.ok);

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("[BOT] Ошибка ответа API:", errorText);
        await ctx.reply(
          `❌ Ошибка при обновлении турнира (status: ${updateResponse.status})`,
        );
        return;
      }

      const updateResult = await updateResponse.json();
      console.log(
        "[BOT] Response body:",
        JSON.stringify(updateResult, null, 2),
      );

      if (!updateResult.success) {
        console.error("[BOT] API вернул success: false:", updateResult.error);
        await ctx.reply("❌ Турнир не найден");
        return;
      }

      const updatedTournament = updateResult.tournament;
      console.log("[BOT] Обновленный турнир получен:", {
        id: updatedTournament?.id,
        name: updatedTournament?.name,
        has_result: !!updatedTournament?.result,
        result_type: Array.isArray(updatedTournament?.tournament_results)
          ? "array"
          : typeof updatedTournament?.tournament_results,
        tournament_results: updatedTournament?.tournament_results,
      });

      if (!updatedTournament) {
        console.error("[BOT] Турнир не вернулся от API!");
        await ctx.reply("❌ Турнир не найден");
        return;
      }

      // Сбрасываем состояние
      ctx.session!.currentAction = undefined;
      ctx.session!.tournamentData = undefined;

      // Проверяем, есть ли результат в обновленном турнире
      let result;
      if (
        Array.isArray(updatedTournament.tournament_results) &&
        updatedTournament.tournament_results.length > 0
      ) {
        // Результат пришел как массив
        result = updatedTournament.tournament_results[0];
        console.log(
          "[BOT] ✅ Результат найден в tournament_results (array):",
          result,
        );
      } else if (
        updatedTournament.tournament_results &&
        typeof updatedTournament.tournament_results === "object" &&
        !Array.isArray(updatedTournament.tournament_results)
      ) {
        // Результат пришел как объект (НЕ массив) - ЭТО НАША ПРОБЛЕМА!
        result = updatedTournament.tournament_results;
        console.log(
          "[BOT] ✅ Результат найден в tournament_results (object):",
          result,
        );
      } else if (updatedTournament.result) {
        // Fallback: результат в поле result
        result = updatedTournament.result;
        console.log("[BOT] ✅ Результат найден в result:", result);
      } else {
        // Результат не найден нигде - используем локальные данные
        console.error(
          "[BOT] ❌ Результат НЕ НАЙДЕН в обновленном турнире! Используем локальные данные.",
        );
        console.error(
          "[BOT] tournament_results type:",
          typeof updatedTournament.tournament_results,
        );
        console.error(
          "[BOT] tournament_results value:",
          updatedTournament.tournament_results,
        );
        result = {
          position,
          payout,
          profit: payout - updatedTournament.buyin,
          roi:
            ((payout - updatedTournament.buyin) / updatedTournament.buyin) *
            100,
          notes: "Добавлено через Telegram бота",
        };
      }

      const roiText =
        result.roi > 0
          ? `+${result.roi.toFixed(1)}%`
          : `${result.roi.toFixed(1)}%`;
      const profitText =
        result.profit > 0
          ? `+$${result.profit}`
          : `-$${Math.abs(result.profit)}`;

      const pos = result.position ?? position;
      const placeText =
        pos === POSITION_UNKNOWN ? "не указано" : `${pos}`;

      const successMessage = `
✅ **Результат добавлен!**

🎰 **${updatedTournament.name}**
🏆 Место: ${placeText}
💰 Выигрыш: $${result.payout}
📈 ROI: ${roiText}
💵 Прибыль: ${profitText}

Результат сохранен в вашем профиле.
      `;

      await ctx.reply(successMessage, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Ошибка добавления результата:", error);
      await ctx.reply(
        "❌ Ошибка при добавлении результата. Попробуйте еще раз.",
      );
    }
  }

  /**
   * Команда /stats - получить статистику
   */
  async getStats(ctx: BotContext) {
    try {
      const userId = ctx.from?.id.toString();

      // Получаем текущую площадку пользователя
      const currentVenue = await UserSettingsService.getCurrentVenue(userId!);

      // Получаем турниры через API
      const apiUrl = getApiUrl();
      const apiResponse = await fetch(
        `${apiUrl}/api/tournaments?userId=${userId}`,
      );

      if (!apiResponse.ok) {
        console.error("API response not ok:", apiResponse.status);
        throw new Error("Failed to fetch tournaments via API");
      }

      const apiResult = await apiResponse.json();
      let tournaments = apiResult.tournaments;

      if (!tournaments || tournaments.length === 0) {
        await ctx.reply("📊 У вас пока нет турниров для статистики.");
        return;
      }

      // Фильтруем турниры по текущей площадке, если она установлена
      if (currentVenue) {
        tournaments = tournaments.filter(
          (tournament: any) => tournament.venue === currentVenue,
        );

        if (tournaments.length === 0) {
          await ctx.reply(
            `📊 У вас нет турниров на площадке "${currentVenue}" для статистики.\n\nИспользуйте \`/setvenue\` для установки другой площадки.`,
            { parse_mode: "Markdown" },
          );
          return;
        }
      }

      // Рассчитываем статистику локально
      const stats = this.calculateStats(tournaments);

      const roiText =
        stats.roi > 0
          ? `+${stats.roi.toFixed(1)}%`
          : `${stats.roi.toFixed(1)}%`;
      const profitText =
        stats.profit > 0 ? `+$${stats.profit}` : `-$${Math.abs(stats.profit)}`;
      const itmRateText = `${stats.itmRate.toFixed(1)}%`;

      const venueHeader = currentVenue
        ? `\n🏨 **Площадка:** ${currentVenue}\n`
        : "";

      const statsMessage = `
📊 **Ваша статистика**${venueHeader}
🎰 **Турниры:** ${stats.totalTournaments}
💵 **Общий бай-ин:** $${stats.totalBuyin}
💰 **Общий выигрыш:** $${stats.totalWinnings}
📈 **Прибыль:** ${profitText}
📊 **ROI:** ${roiText}
🏆 **ITM Rate:** ${itmRateText}

${stats.bestPosition ? `🥇 **Лучшее место:** ${stats.bestPosition}` : ""}
${stats.bestPayout ? `💎 **Лучший выигрыш:** $${stats.bestPayout}` : ""}

Продолжайте играть и улучшайте результаты! 🚀
      `;

      await ctx.reply(statsMessage, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Ошибка получения статистики:", error);
      await ctx.reply("❌ Ошибка получения статистики.");
    }
  }

  /**
   * Команда /tournaments - список турниров
   */
  async listTournaments(ctx: BotContext) {
    try {
      const userId = ctx.from?.id.toString();

      // Получаем турниры через API
      const apiUrl = getApiUrl();
      const apiResponse = await fetch(
        `${apiUrl}/api/tournaments?userId=${userId}`,
      );

      if (!apiResponse.ok) {
        console.error("API response not ok:", apiResponse.status);
        throw new Error("Failed to fetch tournaments via API");
      }

      const apiResult = await apiResponse.json();
      const tournaments = apiResult.tournaments;

      if (!tournaments || tournaments.length === 0) {
        await ctx.reply("📝 У вас пока нет зарегистрированных турниров.");
        return;
      }

      let message = "🎰 **Ваши турниры:**\n\n";

      tournaments.slice(0, 10).forEach((tournament: any, index: number) => {
        const date = new Date(tournament.date).toLocaleDateString("ru-RU");
        const result = tournament.result || tournament.tournament_results?.[0] || tournament.tournament_results;
        const placeLabel =
          result?.position === POSITION_UNKNOWN ? "—" : `${result?.position} место`;
        const status = result
          ? `🏆 ${placeLabel}, $${result.payout}`
          : "⏳ Ожидает результата";

        message += `${index + 1}. **${tournament.name}**\n`;
        message += `   📅 ${date} | 💵 $${tournament.buyin}\n`;
        message += `   🏨 ${tournament.venue}\n`;
        message += `   ${status}\n\n`;
      });

      if (tournaments.length > 10) {
        message += `_...и еще ${tournaments.length - 10} турниров_\n\n`;
      }

      message += "Используйте веб-приложение для подробной информации.";

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Ошибка получения турниров:", error);
      await ctx.reply("❌ Ошибка получения списка турниров.");
    }
  }

  /**
   * Команда /settings - настройки уведомлений
   */
  async settings(ctx: BotContext) {
    const message = `
⚙️ **Настройки уведомлений**

Выберите, какие уведомления вы хотите получать:
    `;

    const keyboard = [
      [
        {
          text: "🔔 Напоминания о турнирах",
          callback_data: "notification_toggle:reminders",
        },
      ],
      [
        {
          text: "📊 Еженедельная статистика",
          callback_data: "notification_toggle:weekly_stats",
        },
      ],
      [
        {
          text: "🎯 Достижения",
          callback_data: "notification_toggle:achievements",
        },
      ],
    ];

    await ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  /**
   * Подтверждение результата
   */
  async confirmResult(ctx: BotContext, resultId: string) {
    await ctx.answerCbQuery("✅ Результат подтвержден!");
    // Логика подтверждения результата
  }

  /**
   * Переключение уведомлений
   */
  async toggleNotification(ctx: BotContext, notificationType: string) {
    const types: Record<string, string> = {
      reminders: "🔔 Напоминания о турнирах",
      weekly_stats: "📊 Еженедельная статистика",
      achievements: "🎯 Достижения",
    };

    const typeName = types[notificationType] || "Уведомления";

    await ctx.answerCbQuery(`${typeName} включены!`);
    await ctx.reply(`✅ ${typeName} включены!`);
  }

  /**
   * Обработка редактирования данных турнира
   */
  async handleTournamentEdit(ctx: BotContext, text: string) {
    const session = ctx.session!;

    // Проверяем команды завершения
    if (text.toLowerCase() === "done") {
      // Завершаем редактирование и создаем турнир
      await this.finalizeTournamentEdit(ctx);
      return;
    }

    if (text.toLowerCase() === "cancel") {
      // Отменяем редактирование
      session.currentAction = undefined;
      session.tournamentData = undefined;
      await ctx.reply("❌ Редактирование отменено.");
      return;
    }

    // Парсим команду редактирования
    const match = text.match(/^(\w+):(.+)$/);
    if (!match) {
      await ctx.reply(
        `
❌ Неверный формат команды.

Используйте формат: \`поле:значение\`

Например:
• \`name:Новое название\`
• \`buyin:500\`
• \`venue:Новая площадка\`

Или введите \`done\` для завершения, \`cancel\` для отмены.
      `,
        { parse_mode: "Markdown" },
      );
      return;
    }

    const [, field, value] = match;
    const tournamentData = session.tournamentData;

    if (!tournamentData) {
      await ctx.reply(
        "❌ Данные турнира не найдены. Попробуйте загрузить фото еще раз.",
      );
      session.currentAction = undefined;
      return;
    }

    // Обновляем поле
    switch (field.toLowerCase()) {
      case "name":
        tournamentData.name = value.trim();
        await ctx.reply(`✅ Название изменено на: ${value.trim()}`);
        break;

      case "date": {
        // Парсим дату в разных форматах
        const dateValue = this.parseDate(value.trim());
        if (dateValue) {
          tournamentData.date = dateValue;
          await ctx.reply(
            `✅ Дата изменена на: ${new Date(dateValue).toLocaleDateString("ru-RU")}`,
          );
        } else {
          await ctx.reply(
            "❌ Неверный формат даты. Используйте: ДД.ММ.ГГГГ или ДД/ММ/ГГГГ",
          );
        }
        break;
      }

      case "buyin": {
        const buyinValue = parseFloat(value.trim());
        if (buyinValue > 0) {
          tournamentData.buyin = buyinValue;
          await ctx.reply(`✅ Бай-ин изменен на: $${buyinValue}`);
        } else {
          await ctx.reply(
            "❌ Неверное значение бай-ина. Введите положительное число.",
          );
        }
        break;
      }

      case "venue":
        tournamentData.venue = value.trim();
        await ctx.reply(`✅ Площадка изменена на: ${value.trim()}`);
        break;

      default:
        await ctx.reply(
          `❌ Неизвестное поле: ${field}. Доступные поля: name, date, buyin, venue`,
        );
        break;
    }

    // Сохраняем обновленные данные в сессию
    session.tournamentData = tournamentData;
  }

  /**
   * Завершение редактирования турнира и его создание
   */
  private async finalizeTournamentEdit(ctx: BotContext) {
    const session = ctx.session!;
    const tournamentData = session.tournamentData;

    if (!tournamentData) {
      await ctx.reply("❌ Данные турнира не найдены.");
      return;
    }

    try {
      // Используем текущую площадку пользователя, если установлена
      const userId = ctx.from?.id.toString();
      const currentVenue = await UserSettingsService.getCurrentVenue(userId!);
      if (currentVenue) {
        tournamentData.venue = currentVenue;
      } else if (
        !tournamentData.venue ||
        tournamentData.venue === "Не указано" ||
        tournamentData.venue === "Не указана"
      ) {
        tournamentData.venue = "Не указано";
      }

      // Создаем турнир через API
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/tournaments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tournamentData,
          userId,
        }),
      });

      if (!response.ok) {
        await ctx.reply("❌ Ошибка при создании турнира. Попробуйте еще раз.");
        return;
      }

      const result = await response.json();

      if (result.success) {
        const tournament = result.tournament;

        // Сбрасываем состояние
        session.currentAction = undefined;
        session.tournamentData = undefined;
        session.ocrData = undefined;

        const successMessage = `
✅ **Турнир успешно создан!**

🎰 **${tournament.name}**
📅 Дата: ${new Date(tournament.date).toLocaleDateString("ru-RU")}
💵 Бай-ин: $${tournament.buyin}
🏨 Площадка: ${tournament.venue}

Турнир добавлен в вашу базу данных.
        `;

        await ctx.reply(successMessage, { parse_mode: "Markdown" });
      } else {
        await ctx.reply("❌ Ошибка при создании турнира. Попробуйте еще раз.");
      }
    } catch (error) {
      console.error("Ошибка создания турнира:", error);
      await ctx.reply("❌ Ошибка при создании турнира. Попробуйте еще раз.");
    }
  }

  /**
   * Парсинг даты из строки
   */
  private parseDate(dateStr: string): string | null {
    // Пробуем разные форматы даты
    const formats = [
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // ДД.ММ.ГГГГ
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // ДД/ММ/ГГГГ
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // ГГГГ-ММ-ДД
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        let day, month, year;

        if (format === formats[2]) {
          // ГГГГ-ММ-ДД
          [, year, month, day] = match;
        } else {
          // ДД.ММ.ГГГГ или ДД/ММ/ГГГГ
          [, day, month, year] = match;
        }

        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
        );

        // Проверяем, что дата валидная
        if (
          date.getFullYear() === parseInt(year) &&
          date.getMonth() === parseInt(month) - 1 &&
          date.getDate() === parseInt(day)
        ) {
          return date.toISOString();
        }
      }
    }

    return null;
  }

  /**
   * Команда /venue - показать текущую площадку
   */
  async showCurrentVenue(ctx: BotContext) {
    try {
      const userId = ctx.from?.id.toString();

      if (!userId) {
        await ctx.reply("❌ Не удалось определить пользователя.");
        return;
      }

      const currentVenue = await UserSettingsService.getCurrentVenue(userId);

      if (!currentVenue) {
        await ctx.reply(
          `
🏨 **Текущая площадка не установлена**

Для установки площадки используйте команду:
\`/setvenue Название площадки\`

Например: \`/setvenue PokerStars Live\`
        `,
          { parse_mode: "Markdown" },
        );
      } else {
        await ctx.reply(
          `
🏨 **Текущая площадка:** ${currentVenue}

Все новые турниры будут создаваться на этой площадке.

Для изменения используйте: \`/setvenue Новая площадка\`
        `,
          { parse_mode: "Markdown" },
        );
      }
    } catch (error) {
      console.error("Ошибка получения текущей площадки:", error);
      await ctx.reply("❌ Ошибка получения информации о площадке.");
    }
  }

  /**
   * Команда /setvenue - установить текущую площадку
   */
  async setCurrentVenue(ctx: BotContext) {
    try {
      const userId = ctx.from?.id.toString();

      if (!userId) {
        await ctx.reply("❌ Не удалось определить пользователя.");
        return;
      }

      // Получаем текст команды
      const messageText = ctx.message?.text || "";
      const command = messageText.split(" ");

      if (command.length < 2) {
        await ctx.reply(
          `
❌ **Неверный формат команды**

Используйте: \`/setvenue Название площадки\`

**Примеры:**
• \`/setvenue PokerStars Live\`
• \`/setvenue Casino Royale\`
• \`/setvenue Онлайн PokerStars\`
        `,
          { parse_mode: "Markdown" },
        );
        return;
      }

      // Извлекаем название площадки (все слова после команды)
      const venueName = command.slice(1).join(" ").trim();

      if (venueName.length < 2) {
        await ctx.reply(
          "❌ Название площадки слишком короткое (минимум 2 символа).",
        );
        return;
      }

      if (venueName.length > 100) {
        await ctx.reply(
          "❌ Название площадки слишком длинное (максимум 100 символов).",
        );
        return;
      }

      // Сохраняем площадку
      const updatedSettings = await UserSettingsService.updateCurrentVenue(
        userId,
        venueName,
      );

      if (updatedSettings) {
        await ctx.reply(
          `
✅ **Площадка установлена:** ${venueName}

Все новые турниры теперь будут создаваться на этой площадке.

Для просмотра текущей площадки: \`/venue\`
        `,
          { parse_mode: "Markdown" },
        );
      } else {
        await ctx.reply(
          "❌ Ошибка при сохранении площадки. Попробуйте еще раз.",
        );
      }
    } catch (error) {
      console.error("Ошибка установки площадки:", error);
      await ctx.reply("❌ Ошибка при установке площадки.");
    }
  }

  /**
   * Рассчет статистики из массива турниров
   */
  private calculateStats(tournaments: any[]) {
    const totalTournaments = tournaments.length;
    let totalBuyin = 0;
    let totalWinnings = 0;
    let itmCount = 0;
    let bestPosition: number | null = null;
    let bestPayout = 0;

    tournaments.forEach((tournament) => {
      totalBuyin += tournament.buyin || 0;

      // Получаем результат из правильного поля (result или tournament_results)
      const result =
        tournament.result ||
        (Array.isArray(tournament.tournament_results)
          ? tournament.tournament_results[0]
          : tournament.tournament_results);

      if (result) {
        totalWinnings += result.payout || 0;
        itmCount += 1;

        // Место не указано (только выигрыш) — не учитываем в лучшем месте
        const pos = result.position;
        if (
          pos !== null &&
          pos !== undefined &&
          pos !== POSITION_UNKNOWN &&
          (bestPosition === null || pos < bestPosition)
        ) {
          bestPosition = pos;
        }

        if (result.payout > bestPayout) {
          bestPayout = result.payout;
        }
      }
    });

    const profit = totalWinnings - totalBuyin;
    const roi = totalBuyin > 0 ? (profit / totalBuyin) * 100 : 0;
    const itmRate =
      totalTournaments > 0 ? (itmCount / totalTournaments) * 100 : 0;

    return {
      totalTournaments,
      totalBuyin,
      totalWinnings,
      profit,
      roi,
      itmRate,
      bestPosition,
      bestPayout: bestPayout > 0 ? bestPayout : null,
    };
  }
}
