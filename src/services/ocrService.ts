import type { TournamentFormData } from "@/types";

export interface OCRResult {
  success: boolean;
  data?: Partial<TournamentFormData>;
  error?: string;
  confidence?: number;
  rawText?: string;
}

/**
 * Очищает название турнира от лишних элементов
 */
export function cleanTournamentName(rawName: string): string {
  if (!rawName) return "";
  let cleaned = rawName.trim();

  // Убираем номер события в начале (EVENT#8, #8, Event 8, №8, EVENT:)
  cleaned = cleaned.replace(
    /^(?:EVENT\s*[#:№]?\s*\d*\s*[-–—]?\s*|[#№]\s*\d+\s*[-–—]?\s*)/i,
    ""
  );

  // Убираем день турнира в конце (Day 1, Day 2, Dag 1, День 1, D1, Flight A)
  cleaned = cleaned.replace(
    /\s*[-–—]?\s*(?:Day|Dag|День|Flight|D)\s*\d*[A-Za-z]?\s*$/i,
    ""
  );

  // Убираем только номер дня в конце
  cleaned = cleaned.replace(/\s+\d+[A-Za-z]?\s*$/, "");

  // Убираем лишние пробелы
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

/**
 * Парсит дату в различных форматах
 */
function parseDate(dateStr: string): string | null {
  // Формат DD.MM.YYYY или DD/MM/YYYY или DD-MM-YYYY
  const ddmmyyyy = dateStr.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T18:00`;
  }

  // Формат YYYY.MM.DD или YYYY/MM/DD или YYYY-MM-DD
  const yyyymmdd = dateStr.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T18:00`;
  }

  return null;
}

/**
 * Извлекает данные турнира из распознанного текста билета
 */
function extractTournamentData(text: string): Partial<TournamentFormData> {
  const data: Partial<TournamentFormData> = {};
  console.warn("🔍 Парсинг текста:\n", text);

  // Нормализуем текст: заменяем переносы строк на пробелы для поиска,
  // но сохраняем оригинал для построчного поиска
  const normalizedText = text.replace(/\r\n/g, "\n");
  const lines = normalizedText.split("\n").map((line) => line.trim());

  // === ИЗВЛЕЧЕНИЕ НАЗВАНИЯ ТУРНИРА ===
  // Паттерн 1: EVENT:#2 OPENER Day 1 или EVENT#8 RUSSIAN POKER OPEN
  const eventPatterns = [
    /EVENT\s*[:#]?\s*#?\d*\s*(.+?)(?:\n|$)/i,
    /EVENT\s*[:#]?\s*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of eventPatterns) {
    const eventMatch = normalizedText.match(pattern);
    if (eventMatch?.[1]) {
      const rawName = eventMatch[1].trim();
      data.name = cleanTournamentName(rawName);
      console.warn("🔍 Найдено название через EVENT:", data.name);
      break;
    }
  }

  // Паттерн 2: Ищем строку с названием серии (RPC, RPT, EPT, WSOP и т.д.)
  if (!data.name) {
    for (const line of lines) {
      const seriesMatch = line.match(
        /^(RPC|RPT|RPF|EPT|WSOP|WPT|APT|POKER|MAIN\s*EVENT)[^a-z]*(.+)?/i
      );
      if (seriesMatch) {
        const rawName = (seriesMatch[1] + (seriesMatch[2] || "")).trim();
        data.name = cleanTournamentName(rawName);
        console.warn("🔍 Найдено название через серию:", data.name);
        break;
      }
    }
  }

  // === ИЗВЛЕЧЕНИЕ ДАТЫ ===
  // Приоритет: DATE: > Sales time: > любая дата в тексте
  const datePatterns = [
    /DATE\s*[:\s]\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/i,
    /Sales\s*time\s*[:\s]\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/i,
    /(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/,
  ];

  for (const pattern of datePatterns) {
    const dateMatch = normalizedText.match(pattern);
    if (dateMatch?.[1]) {
      const parsedDate = parseDate(dateMatch[1]);
      if (parsedDate) {
        data.date = parsedDate;
        console.warn("🔍 Найдена дата:", data.date);
        break;
      }
    }
  }

  // === ИЗВЛЕЧЕНИЕ МЕСТА ПРОВЕДЕНИЯ ===
  const venuePatterns = [
    /CASINO\s+([A-Z0-9\s]+?)(?:\d{4})?(?:\n|$)/i,
    /VENUE\s*[:\s]\s*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of venuePatterns) {
    const venueMatch = normalizedText.match(pattern);
    if (venueMatch?.[1]) {
      data.venue = venueMatch[1].trim();
      console.warn("🔍 Найдена площадка:", data.venue);
      break;
    }
  }

  // Также ищем название площадки в заголовке (RPC FINAL ... CASINO SOCHI)
  if (!data.venue) {
    const headerVenue = normalizedText.match(
      /CASINO\s+([A-Z]+)/i
    );
    if (headerVenue?.[1]) {
      data.venue = `Casino ${headerVenue[1]}`;
      console.warn("🔍 Найдена площадка в заголовке:", data.venue);
    }
  }

  // === ИЗВЛЕЧЕНИЕ БАЙ-ИНА ===
  // Приоритет: BUYIN > AMOUNT
  // BUYIN обычно = основной взнос, FEE = рейк
  let buyin = 0;
  let fee = 0;

  const buyinMatch = normalizedText.match(/BUYIN\s*[:\s]\s*(\d+)/i);
  if (buyinMatch) {
    buyin = parseInt(buyinMatch[1]);
    console.warn("🔍 Найден BUYIN:", buyin);
  }

  const feeMatch = normalizedText.match(/FEE\s*[:\s]\s*(\d+)/i);
  if (feeMatch) {
    fee = parseInt(feeMatch[1]);
    console.warn("🔍 Найден FEE:", fee);
  }

  // Если нет BUYIN, используем AMOUNT
  if (!buyin) {
    const amountMatch = normalizedText.match(/AMOUNT\s*[:\s]\s*(\d+)/i);
    if (amountMatch) {
      buyin = parseInt(amountMatch[1]);
      fee = 0; // AMOUNT обычно уже включает fee
      console.warn("🔍 Найден AMOUNT:", buyin);
    }
  }

  // Общая сумма = buyin + fee
  data.buyin = buyin + fee;
  console.warn("🔍 Итоговый бай-ин:", data.buyin);

  // === ИЗВЛЕЧЕНИЕ СТАРТОВОГО СТЕКА ===
  const chipsMatch = normalizedText.match(/CHIPS\s*[:\s]\s*(\d+)/i);
  if (chipsMatch) {
    data.startingStack = parseInt(chipsMatch[1]);
    console.warn("🔍 Найден стартовый стек:", data.startingStack);
  }

  // === ОПРЕДЕЛЕНИЕ ТИПА ТУРНИРА ===
  const nameText = (data.name || normalizedText).toLowerCase();
  if (nameText.includes("rebuy") || nameText.includes("ребай")) {
    data.tournamentType = "rebuy";
  } else if (nameText.includes("bounty") || nameText.includes("баунти") || nameText.includes("knockout") || nameText.includes("ko ")) {
    data.tournamentType = "bounty";
  } else if (nameText.includes("satellite") || nameText.includes("сателлит")) {
    data.tournamentType = "satellite";
  } else if (nameText.includes("addon") || nameText.includes("add-on")) {
    data.tournamentType = "addon";
  } else {
    data.tournamentType = "freezeout";
  }

  // === УСТАНОВКА СТРУКТУРЫ ПО УМОЛЧАНИЮ ===
  if (!data.structure) {
    if (nameText.includes("plo") || nameText.includes("omaha")) {
      data.structure = "PLO";
    } else {
      data.structure = "NL Hold'em";
    }
  }

  return data;
}

/**
 * Скачивает изображение по URL и конвертирует в base64
 */
async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  console.warn("🔍 OCR: Скачиваем изображение:", imageUrl);
  
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  
  // Определяем MIME тип
  const contentType = response.headers.get("content-type") || "image/jpeg";
  
  console.warn("🔍 OCR: Изображение скачано, размер:", Math.round(base64.length / 1024), "KB");
  
  return `data:${contentType};base64,${base64}`;
}

/**
 * Извлекает текст из изображения через OCR.space API
 */
async function extractTextFromImage(imageUrl: string): Promise<{
  success: boolean;
  text?: string;
  error?: string;
}> {
  const apiKey = process.env.OCR_API_KEY || "helloworld"; // helloworld - демо ключ с ограничениями

  try {
    console.warn("🔍 OCR: Начинаем обработку изображения:", imageUrl);

    // Скачиваем изображение и конвертируем в base64
    const base64Image = await downloadImageAsBase64(imageUrl);

    // Отправляем base64 вместо URL
    const formData = new URLSearchParams();
    formData.append("base64Image", base64Image);
    formData.append("language", "rus,eng");
    formData.append("isOverlayRequired", "false");
    formData.append("scale", "true");
    formData.append("OCREngine", "2"); // Engine 2 лучше для русского текста

    console.warn("🔍 OCR: Отправляем на OCR.space API...");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OCR API HTTP error:", response.status, errorText);
      throw new Error(`OCR API error: ${response.status}`);
    }

    const result = await response.json();
    console.warn("🔍 OCR API ответ:", JSON.stringify(result, null, 2));

    if (result.IsErroredOnProcessing) {
      const errorMsg = result.ErrorMessage?.[0] || result.ErrorDetails || "OCR processing failed";
      console.error("❌ OCR API processing error:", errorMsg);
      throw new Error(errorMsg);
    }

    const parsedResults = result.ParsedResults;
    if (!parsedResults || parsedResults.length === 0) {
      console.error("❌ OCR: Нет результатов распознавания");
      throw new Error("Не удалось распознать текст на изображении");
    }

    const extractedText = parsedResults
      .map((r: { ParsedText: string }) => r.ParsedText)
      .join("\n");

    console.warn("🔍 OCR: Распознанный текст:\n", extractedText);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("OCR вернул пустой результат");
    }

    return {
      success: true,
      text: extractedText,
    };
  } catch (error) {
    console.error("❌ OCR ошибка:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "OCR failed",
    };
  }
}

/**
 * Обрабатывает изображение билета и извлекает данные турнира
 */
export async function processTicketImage(
  file: File | string,
): Promise<OCRResult> {
  try {
    const imageUrl = typeof file === "string" ? file : "";

    if (!imageUrl) {
      return {
        success: false,
        error: "Не удалось получить URL изображения",
      };
    }

    console.warn("🔍 OCR: Начинаем обработку изображения:", imageUrl);

    // Извлекаем текст из изображения через OCR API
    const ocrResult = await extractTextFromImage(imageUrl);

    if (!ocrResult.success || !ocrResult.text) {
      return {
        success: false,
        error: ocrResult.error || "Не удалось распознать текст на изображении",
      };
    }

    // Парсим извлеченные данные
    const extractedData = extractTournamentData(ocrResult.text);
    console.warn("🔍 OCR: Извлеченные данные:", JSON.stringify(extractedData, null, 2));

    // Добавляем текущую дату если не извлечена
    if (!extractedData.date) {
      const now = new Date();
      extractedData.date = now.toISOString().slice(0, 16);
    }

    // Устанавливаем тип турнира по умолчанию
    if (!extractedData.tournamentType) {
      extractedData.tournamentType = "freezeout";
    }

    // Устанавливаем структуру по умолчанию
    if (!extractedData.structure) {
      extractedData.structure = "NL Hold'em";
    }

    return {
      success: true,
      data: extractedData,
      confidence: 0.85,
      rawText: ocrResult.text,
    };
  } catch (error) {
    console.error("❌ OCR: Ошибка при обработке изображения:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Ошибка при обработке изображения",
    };
  }
}

// Функция для валидации извлеченных данных
export function validateOCRData(data: Partial<TournamentFormData>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Обязательные поля
  if (!data.name || data.name.trim().length === 0) {
    errors.push("Не удалось определить название турнира");
  }

  if (!data.buyin || data.buyin <= 0) {
    errors.push("Не удалось определить бай-ин");
  }

  if (!data.date) {
    errors.push("Не удалось определить дату турнира");
  }

  // Предупреждения
  if (!data.venue || data.venue.trim().length === 0) {
    warnings.push("Место проведения не определено");
  }

  if (!data.startingStack || data.startingStack <= 0) {
    warnings.push("Стартовый стек не определен");
  }

  if (data.buyin && (data.buyin < 1 || data.buyin > 100000)) {
    warnings.push("Необычный размер бай-ина");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Функция для улучшения качества изображения перед OCR
export function preprocessImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    // Мок предобработки изображения
    // В реальном приложении здесь была бы обработка через Canvas API
    setTimeout(() => {
      resolve(file);
    }, 500);
  });
}

// Типы для конфигурации OCR
export interface OCRConfig {
  language: string;
  confidence: number;
  preprocessing: boolean;
  autoRotate: boolean;
}

export const defaultOCRConfig: OCRConfig = {
  language: "eng+rus",
  confidence: 0.7,
  preprocessing: true,
  autoRotate: true,
};
