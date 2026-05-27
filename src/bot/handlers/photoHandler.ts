/**
 * Обработчик фотографий билетов турниров
 * Использует мок OCR сервис для извлечения данных
 */

import type { BotContext } from "../index";
import { processTicketImage } from "../../services/ocrService";
import { UserSettingsService } from "@/services/userSettingsService";
import { UserService } from "@/services/userService";
import { escapeMarkdown } from "../utils";

export class PhotoHandler {
  /**
   * Обработка документа как фотографии билета турнира
   */
  async handleDocumentAsPhoto(ctx: BotContext) {
    try {
      if (!ctx.message || !("document" in ctx.message)) {
        return;
      }

      const document = ctx.message.document;
      if (!document) {
        await ctx.reply("❌ Не удалось получить документ.");
        return;
      }

      // Проверяем, что это изображение
      if (!document.mime_type?.startsWith("image/")) {
        await ctx.reply(
          "❌ Файл не является изображением. Пожалуйста, отправьте фото билета.",
        );
        return;
      }

      await ctx.reply("📸 Обрабатываю изображение билета...");

      // Получаем ссылку на файл
      const fileLink = await ctx.telegram.getFileLink(document.file_id);
      console.warn("📸 Получена ссылка на файл документа:", fileLink.href);

      // Обрабатываем изображение через мок OCR сервис
      const ocrResult = await processTicketImage(fileLink.href);
      console.warn("🔍 Результат OCR для документа:", ocrResult);

      if (!ocrResult.success) {
        await ctx.reply(
          "❌ Не удалось распознать данные на билете.\n\n" +
            "Попробуйте:\n" +
            "• Сделать фото более четким\n" +
            "• Убедиться, что весь билет виден\n" +
            "• Улучшить освещение\n\n" +
            "Или используйте /register для ручного ввода.",
        );
        return;
      }

      const data = ocrResult.data!;

      // Определяем финальную площадку (текущая пользователя или из OCR)
      const telegramId = ctx.from?.id.toString() || "user-1";
      console.warn(
        "🔍 [handleDocumentAsPhoto] Получаем текущую площадку пользователя:",
        telegramId,
      );
      const currentVenueDoc =
        await UserSettingsService.getCurrentVenue(telegramId);
      console.warn(
        "🏨 [handleDocumentAsPhoto] Текущая площадка пользователя:",
        currentVenueDoc,
      );
      console.warn("🏨 [handleDocumentAsPhoto] Площадка из OCR:", data.venue);
      const finalVenueDoc = currentVenueDoc || data.venue || "Не указана";
      console.warn(
        "🏨 [handleDocumentAsPhoto] Финальная площадка для отображения:",
        finalVenueDoc,
      );

      // Проверяем инициализацию сессии
      if (!ctx.session) {
        console.error("❌ [handleDocumentAsPhoto] Сессия не инициализирована");
        await ctx.reply(
          "❌ Техническая ошибка: сессия не инициализирована.\n\n" +
            "Попробуйте:\n" +
            "• Отправить команду /start\n" +
            "• Отправить фото еще раз",
        );
        return;
      }

      // Сохраняем данные в сессии (с подстановкой финальной площадки)
      ctx.session.ocrData = { ...data, venue: finalVenueDoc };
      console.warn(
        "💾 Данные OCR из документа сохранены в сессии (с финальной площадкой):",
        JSON.stringify(ctx.session.ocrData, null, 2),
      );

      // Показываем распознанные данные пользователю
      let venueTextDoc = escapeMarkdown(finalVenueDoc);
      if (currentVenueDoc && currentVenueDoc !== data.venue) {
        venueTextDoc += ` *(установлена как текущая)*`;
      }
      const confirmMessage = `
📸 **Данные распознаны с билета:**

🎰 **Турнир:** ${escapeMarkdown(data.name || "Не определено")}
📅 **Дата:** ${data.date ? new Date(data.date).toLocaleDateString("ru-RU") : "Не определена"}
💵 **Бай-ин:** $${data.buyin || 0}
🏨 **Площадка:** ${venueTextDoc}
🎯 **Тип:** ${escapeMarkdown(data.tournamentType || "Freezeout")}

Все верно? Нажмите ✅ для подтверждения или ❌ для отмены.
      `;

      const keyboard = [
        [
          { text: "✅ Подтвердить", callback_data: "confirm_tournament" },
          { text: "❌ Отменить", callback_data: "cancel_tournament" },
        ],
        [{ text: "✏️ Редактировать", callback_data: "edit_tournament" }],
      ];

      await ctx.reply(confirmMessage, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard },
      });
    } catch (error) {
      console.error("❌ Ошибка обработки документа как фотографии:", error);

      let errorMessage = "❌ Произошла ошибка при обработке изображения.\n\n";

      if (error instanceof Error) {
        if (error.message.includes("file_id")) {
          errorMessage += "Проблема с получением файла от Telegram.\n";
        } else if (
          error.message.includes("OCR") ||
          error.message.includes("processing")
        ) {
          errorMessage += "Ошибка распознавания текста на изображении.\n";
        } else {
          errorMessage += `Техническая ошибка: ${escapeMarkdown(error.message)}\n`;
        }
      }

      errorMessage += "\n💡 **Что можно попробовать:**\n";
      errorMessage += "• Отправить изображение еще раз\n";
      errorMessage +=
        "• Убедиться, что изображение четкое и билет полностью виден\n";
      errorMessage += "• Использовать /register для ручного ввода\n";
      errorMessage +=
        "• Обратиться к администратору, если проблема повторяется";

      await ctx.reply(errorMessage, { parse_mode: "Markdown" });
    }
  }

  /**
   * Обработка фото билета турнира
   */
  async handlePhoto(ctx: BotContext) {
    try {
      if (!ctx.message || !("photo" in ctx.message)) {
        return;
      }

      const photos = ctx.message.photo;
      if (!photos || photos.length === 0) {
        await ctx.reply("❌ Не удалось получить фотографию.");
        return;
      }

      // Берем фото с наилучшим качеством (последнее в массиве)
      const bestPhoto = photos[photos.length - 1];

      await ctx.reply("📸 Обрабатываю фотографию билета...");

      // Получаем ссылку на файл
      const fileLink = await ctx.telegram.getFileLink(bestPhoto.file_id);
      console.warn("📸 Получена ссылка на файл:", fileLink.href);

      // Обрабатываем изображение через мок OCR сервис
      const ocrResult = await processTicketImage(fileLink.href);
      console.warn("🔍 Результат OCR:", ocrResult);

      if (!ocrResult.success) {
        await ctx.reply(
          "❌ Не удалось распознать данные на билете.\n\n" +
            "Попробуйте:\n" +
            "• Сделать фото более четким\n" +
            "• Убедиться, что весь билет виден\n" +
            "• Улучшить освещение\n\n" +
            "Или используйте /register для ручного ввода.",
        );
        return;
      }

      const data = ocrResult.data!;

      // Определяем финальную площадку (текущая пользователя или из OCR)
      const telegramId = ctx.from?.id.toString() || "user-1";
      console.warn("🔍 Получаем текущую площадку пользователя:", telegramId);
      const currentVenue =
        await UserSettingsService.getCurrentVenue(telegramId);
      console.warn("🏨 Текущая площадка пользователя:", currentVenue);
      console.warn("🏨 Площадка из OCR:", data.venue);
      const finalVenue = currentVenue || data.venue || "Не указана";
      console.warn("🏨 Финальная площадка для отображения:", finalVenue);

      // Проверяем инициализацию сессии
      if (!ctx.session) {
        console.error("❌ [handlePhoto] Сессия не инициализирована");
        await ctx.reply(
          "❌ Техническая ошибка: сессия не инициализирована.\n\n" +
            "Попробуйте:\n" +
            "• Отправить команду /start\n" +
            "• Отправить фото еще раз",
        );
        return;
      }

      // Сохраняем данные в сессии
      ctx.session.ocrData = data;
      console.warn(
        "💾 Данные OCR сохранены в сессии:",
        JSON.stringify(data, null, 2),
      );

      // Показываем распознанные данные пользователю
      let venueText = escapeMarkdown(finalVenue);
      console.warn("🔍 [handlePhoto] Проверяем условие для пометки:");
      console.warn("🔍 [handlePhoto] currentVenue:", currentVenue);
      console.warn("🔍 [handlePhoto] data.venue:", data.venue);
      console.warn(
        "🔍 [handlePhoto] currentVenue !== data.venue:",
        currentVenue !== data.venue,
      );

      if (currentVenue && currentVenue !== data.venue) {
        venueText += ` *(установлена как текущая)*`;
        console.warn(
          "🔍 [handlePhoto] Добавлена пометка, venueText:",
          venueText,
        );
      } else {
        console.warn("🔍 [handlePhoto] Пометка НЕ добавлена");
      }

      const confirmMessage = `
📸 **Данные распознаны с билета:**

🎰 **Турнир:** ${escapeMarkdown(data.name || "Не определено")}
📅 **Дата:** ${data.date ? new Date(data.date).toLocaleDateString("ru-RU") : "Не определена"}
💵 **Бай-ин:** $${data.buyin || 0}
🏨 **Площадка:** ${venueText}
🎯 **Тип:** ${escapeMarkdown(data.tournamentType || "Freezeout")}

Все верно? Нажмите ✅ для подтверждения или ❌ для отмены.
      `;

      const keyboard = [
        [
          { text: "✅ Подтвердить", callback_data: "confirm_tournament" },
          { text: "❌ Отменить", callback_data: "cancel_tournament" },
        ],
        [{ text: "✏️ Редактировать", callback_data: "edit_tournament" }],
      ];

      await ctx.reply(confirmMessage, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard },
      });
    } catch (error) {
      console.error("❌ Ошибка обработки фотографии:", error);

      // Определяем тип ошибки для более информативного сообщения
      let errorMessage = "❌ Произошла ошибка при обработке фотографии.\n\n";

      if (error instanceof Error) {
        if (error.message.includes("file_id")) {
          errorMessage += "Проблема с получением файла от Telegram.\n";
        } else if (
          error.message.includes("OCR") ||
          error.message.includes("processing")
        ) {
          errorMessage += "Ошибка распознавания текста на изображении.\n";
        } else {
          errorMessage += `Техническая ошибка: ${escapeMarkdown(error.message)}\n`;
        }
      }

      errorMessage += "\n💡 **Что можно попробовать:**\n";
      errorMessage += "• Отправить фото еще раз\n";
      errorMessage += "• Убедиться, что фото четкое и билет полностью виден\n";
      errorMessage += "• Использовать /register для ручного ввода\n";
      errorMessage +=
        "• Обратиться к администратору, если проблема повторяется";

      await ctx.reply(errorMessage, { parse_mode: "Markdown" });
    }
  }

  /**
   * Подтверждение создания турнира из OCR данных
   */
  async confirmTournament(ctx: BotContext) {
    try {
      await ctx.answerCbQuery();

      // Получаем данные из сессии
      console.warn("🔍 Проверяем сессию:", ctx.session);
      const data = ctx.session.ocrData;
      console.warn("🔍 Данные OCR из сессии:", data);

      if (!data) {
        console.warn("❌ Данные OCR не найдены в сессии");
        await ctx.reply(
          "❌ Данные OCR не найдены. Попробуйте отправить фото еще раз.",
        );
        return;
      }

      // Создаем турнир через API
      const telegramId = ctx.from?.id.toString() || "user-1";

      // Получаем UUID пользователя по Telegram ID
      console.warn(
        "🔍 [confirmTournament] Получаем UUID пользователя по Telegram ID:",
        telegramId,
      );
      const userUuid = await UserService.getUserUuidByTelegramId(telegramId);
      console.warn("🔍 [confirmTournament] UUID пользователя:", userUuid);

      // Если UUID не найден, используем Telegram ID - API создаст пользователя через getUserOrCreate
      const finalUserId = userUuid || telegramId;
      console.warn(
        "🔍 [confirmTournament] Финальный ID для создания турнира:",
        finalUserId,
      );

      // Используем текущую площадку пользователя, если установлена, иначе берем из OCR
      console.warn(
        "🔍 [confirmTournament] Получаем текущую площадку пользователя:",
        telegramId,
      );
      const currentVenue =
        await UserSettingsService.getCurrentVenue(telegramId);
      console.warn(
        "🏨 [confirmTournament] Текущая площадка пользователя:",
        currentVenue,
      );
      console.warn("🏨 [confirmTournament] Площадка из OCR:", data.venue);
      const venue = currentVenue || data.venue || "Не указано";
      console.warn(
        "🏨 [confirmTournament] Финальная площадка для создания турнира:",
        venue,
      );

      const tournamentData = {
        userId: finalUserId,
        name: data.name || "Турнир из билета",
        date: data.date || new Date().toISOString(),
        buyin: data.buyin || 0,
        venue: venue,
        tournamentType: data.tournamentType || "freezeout",
        structure: data.structure || "NL Hold'em",
        participants: data.participants,
        prizePool: data.prizePool,
        blindLevels: data.blindLevels,
        startingStack: data.startingStack,
        notes: "Создано через распознавание билета в Telegram боте",
      };

      // Получаем правильный API URL для текущего окружения
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.VERCEL_URL ||
        "http://localhost:3000";
      const apiUrl = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
      const apiEndpoint = `${apiUrl}/api/tournaments`;

      console.warn(
        `🌐 [confirmTournament] Отправляем запрос к API: ${apiEndpoint}`,
      );

      // Отправляем запрос к API с timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд timeout

      const apiResponse = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tournamentData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text().catch(() => "Unknown error");
        console.error(`❌ API error: ${apiResponse.status} - ${errorText}`);
        throw new Error(`API error: ${apiResponse.status} - ${errorText}`);
      }

      const apiResult = await apiResponse.json();
      if (!apiResult.success) {
        console.error("❌ API вернул ошибку:", apiResult);
        throw new Error(
          apiResult.error || "Failed to create tournament via API",
        );
      }

      const newTournament = apiResult.tournament;

      // Очищаем данные OCR из сессии
      ctx.session.ocrData = undefined;

      const successMessage = `
✅ **Турнир успешно создан!**

🎰 **${escapeMarkdown(newTournament.name)}**
📅 ${new Date(newTournament.date).toLocaleDateString("ru-RU")}
💵 Бай-ин: $${newTournament.buyin}
🏨 ${escapeMarkdown(newTournament.venue)}

ID турнира: \`${newTournament.id}\`

🎯 **Что дальше?**
• После турнира используйте /result для добавления результата
• Просматривайте статистику командой /stats
• Настройте уведомления через /settings

Удачи за столами! 🍀
      `;

      await ctx.editMessageText(successMessage, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [] },
      });
    } catch (error) {
      console.error("Ошибка создания турнира:", error);

      let errorMessage = "❌ Ошибка при создании турнира.\n\n";

      if (error instanceof Error) {
        if (error.message.includes("API error: 401")) {
          errorMessage +=
            "🔐 Проблема с авторизацией. Убедитесь что вы связали аккаунт командой /link";
        } else if (error.message.includes("API error: 500")) {
          errorMessage += "🔧 Техническая ошибка сервера. Попробуйте позже.";
        } else if (
          error.message.includes("AbortError") ||
          error.message.includes("timeout")
        ) {
          errorMessage +=
            "⏰ Превышено время ожидания. Сервер может быть перегружен.";
        } else if (error.message.includes("fetch")) {
          errorMessage +=
            "🌐 Проблема с подключением к серверу. Проверьте интернет.";
        } else {
          errorMessage += `🐛 Техническая ошибка: ${escapeMarkdown(error.message)}`;
        }
      }

      errorMessage += "\n\n💡 **Что можно сделать:**\n";
      errorMessage += "• Попробовать еще раз через несколько минут\n";
      errorMessage += "• Использовать /register для ручного ввода\n";
      errorMessage += "• Обратиться к администратору если проблема повторяется";

      await ctx.reply(errorMessage, { parse_mode: "Markdown" });
    }
  }

  /**
   * Отмена создания турнира
   */
  async cancelTournament(ctx: BotContext) {
    await ctx.answerCbQuery();

    // Очищаем данные OCR из сессии
    ctx.session.ocrData = undefined;

    await ctx.editMessageText(
      "❌ Создание турнира отменено.\n\n" +
        "Вы можете:\n" +
        "• Отправить другое фото билета\n" +
        "• Использовать /register для ручного ввода",
      { reply_markup: { inline_keyboard: [] } },
    );
  }

  /**
   * Редактирование данных турнира
   */
  async editTournament(ctx: BotContext) {
    await ctx.answerCbQuery();

    // Получаем данные из сессии
    const data = ctx.session.ocrData;
    if (!data) {
      await ctx.reply(
        "❌ Данные OCR не найдены. Попробуйте отправить фото еще раз.",
      );
      return;
    }

    ctx.session.currentAction = "edit_tournament";
    ctx.session.tournamentData = data;

    const editMessage = `
✏️ **Редактирование данных турнира**

Текущие данные:
🎰 Турнир: ${escapeMarkdown(data.name || "Не определено")}
📅 Дата: ${data.date ? new Date(data.date).toLocaleDateString("ru-RU") : "Не определена"}
💵 Бай-ин: $${data.buyin || 0}
🏨 Площадка: ${escapeMarkdown(data.venue || "Не указана")}

Введите исправления в формате:
\`поле:значение\`

**Доступные поля:**
• \`name:Новое название\`
• \`date:15.12.2024\`
• \`buyin:500\`
• \`venue:Новая площадка\`

Для завершения редактирования введите \`done\`
Для отмены введите \`cancel\`
    `;

    await ctx.editMessageText(editMessage, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [] },
    });
  }

  /**
   * Валидация фотографии билета
   */
  private validateTicketPhoto(fileSize: number, fileId: string): boolean {
    // Проверяем размер файла (не более 20MB)
    if (fileSize > 20 * 1024 * 1024) {
      return false;
    }

    // Проверяем, что это изображение по file_id
    if (!fileId || fileId.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Получение метаданных фотографии
   */
  private async getPhotoMetadata(ctx: BotContext, fileId: string) {
    try {
      const file = await ctx.telegram.getFile(fileId);
      return {
        size: file.file_size || 0,
        path: file.file_path || "",
        uniqueId: file.file_unique_id,
      };
    } catch (error) {
      console.error("Ошибка получения метаданных фото:", error);
      return null;
    }
  }

  /**
   * Сохранение фотографии для истории
   */
  private async savePhotoToHistory(
    tournamentId: string,
    fileId: string,
    ocrData: any,
  ) {
    // В реальном приложении здесь была бы логика сохранения в базу данных
    console.warn(`Сохранение фото для турнира ${tournamentId}:`, {
      fileId,
      ocrData,
      timestamp: new Date().toISOString(),
    });
  }
}
