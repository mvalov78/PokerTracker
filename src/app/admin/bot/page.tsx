"use client";

import { useEffect, useState } from "react";

/**
 * Страница управления Telegram ботом
 */

interface BotStatus {
  currentMode: "polling" | "webhook";
  botStatus: "active" | "inactive" | "error";
  webhookInfo?: {
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    last_error_date?: number;
    last_error_message?: string;
  };
  settings?: Record<string, string>;
  botInstanceStatus?: {
    status: string;
    mode: string;
    isRunning: boolean;
  };
}

export default function BotManagementPage() {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем статус бота при загрузке страницы
  useEffect(() => {
    loadBotStatus();

    // Обновляем статус каждые 30 секунд
    const interval = setInterval(loadBotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadBotStatus = async () => {
    try {
      const response = await fetch("/api/admin/bot-mode");
      const data = await response.json();

      if (data.success) {
        setBotStatus(data);
        setError(null);
      } else {
        setError(data.error || "Не удалось загрузить статус бота");
      }
    } catch (err) {
      console.error("Ошибка загрузки статуса бота:", err);
      setError("Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  const controlPolling = async (command: string) => {
    try {
      const response = await fetch("/api/bot/polling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}`);
        await loadBotStatus(); // Перезагружаем статус
      } else {
        alert(`❌ Ошибка: ${result.error}`);
      }
    } catch (error) {
      alert("❌ Ошибка подключения к боту");
      console.error("Ошибка управления polling:", error);
    }
  };

  const switchMode = async (
    mode: "polling" | "webhook",
    webhookUrl?: string,
  ) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/bot-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, webhookUrl }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}`);
        await loadBotStatus();
      } else {
        alert(`❌ Ошибка: ${result.error}`);
      }
    } catch (error) {
      alert("❌ Ошибка переключения режима");
      console.error("Ошибка переключения режима:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeBot = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bot/init", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `✅ ${result.message}\n\nРежим: ${result.mode}\n${result.webhookUrl ? `Webhook URL: ${result.webhookUrl}` : ""}`,
        );
        await loadBotStatus();
      } else {
        alert(`❌ Ошибка инициализации:\n${result.error}`);
      }
    } catch (error) {
      alert("❌ Ошибка инициализации бота");
      console.error("Ошибка инициализации:", error);
    } finally {
      setLoading(false);
    }
  };

  const simulateCommand = async (command: string) => {
    try {
      const response = await fetch("/api/bot/polling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "simulate",
          data: { command },
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`🧪 ${result.message}`);
      } else {
        alert(`❌ Ошибка: ${result.error}`);
      }
    } catch (error) {
      alert("❌ Ошибка симуляции команды");
      console.error("Ошибка симуляции:", error);
    }
  };

  // Определяем иконку и цвет статуса
  const getStatusDisplay = () => {
    if (loading && !botStatus) {
      return { icon: "⏳", text: "Загрузка...", color: "text-gray-600" };
    }

    if (error) {
      return { icon: "❌", text: "Ошибка загрузки", color: "text-red-600" };
    }

    if (!botStatus) {
      return { icon: "❓", text: "Статус неизвестен", color: "text-gray-600" };
    }

    const mode = botStatus.currentMode;
    const status = botStatus.botStatus;

    if (status === "error") {
      return {
        icon: "⚠️",
        text: "Бот в состоянии ошибки",
        color: "text-red-600",
      };
    }

    if (status === "inactive") {
      return { icon: "⏸️", text: "Бот остановлен", color: "text-gray-600" };
    }

    if (mode === "webhook") {
      return {
        icon: "🔗",
        text: "Webhook режим активен",
        color: "text-green-600",
        description: "Бот получает обновления через webhook",
      };
    }

    return {
      icon: "🔄",
      text: "Polling режим активен",
      color: "text-blue-600",
      description: "Бот опрашивает сервер Telegram каждые 30 секунд",
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🤖 Управление Telegram Ботом
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Мониторинг и управление Telegram ботом для PokerTracker Pro
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={initializeBot}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Синхронизировать webhook из переменной окружения BOT_WEBHOOK_URL"
              >
                {loading ? "⏳ Загрузка..." : "⚙️ Синхронизировать из .env"}
              </button>
              <button
                onClick={loadBotStatus}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? "⏳ Обновление..." : "🔄 Обновить статус"}
              </button>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📡 Статус Бота
          </h2>

          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">{statusDisplay.icon}</span>
            <div>
              <div
                className={`font-semibold ${statusDisplay.color} dark:${statusDisplay.color}`}
              >
                {statusDisplay.text}
              </div>
              {statusDisplay.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {statusDisplay.description}
                </div>
              )}
            </div>
          </div>

          {/* Детали статуса */}
          {botStatus && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Режим:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {botStatus.currentMode === "webhook"
                      ? "Webhook"
                      : "Polling"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Статус:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {botStatus.botStatus === "active"
                      ? "Активен"
                      : botStatus.botStatus === "inactive"
                        ? "Остановлен"
                        : "Ошибка"}
                  </span>
                </div>
                {botStatus.currentMode === "webhook" &&
                  botStatus.webhookInfo && (
                    <>
                      <div className="col-span-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          Webhook URL:
                        </span>
                        <div className="ml-2 font-mono text-xs text-gray-900 dark:text-white break-all">
                          {botStatus.webhookInfo.url || "Не настроен"}
                        </div>
                      </div>
                      {botStatus.webhookInfo.pending_update_count > 0 && (
                        <div className="col-span-2">
                          <span className="text-yellow-600">
                            ⚠️ Ожидающих обновлений:{" "}
                            {botStatus.webhookInfo.pending_update_count}
                          </span>
                        </div>
                      )}
                      {botStatus.webhookInfo.last_error_message && (
                        <div className="col-span-2">
                          <span className="text-red-600">
                            ❌ Последняя ошибка:{" "}
                            {botStatus.webhookInfo.last_error_message}
                          </span>
                        </div>
                      )}
                    </>
                  )}
              </div>
            </div>
          )}

          <div className="flex space-x-2 mt-4">
            {botStatus?.currentMode === "polling" && (
              <>
                <button
                  onClick={() => controlPolling("start")}
                  disabled={loading || botStatus?.botStatus === "active"}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ▶️ Запустить
                </button>
                <button
                  onClick={() => controlPolling("stop")}
                  disabled={loading || botStatus?.botStatus === "inactive"}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⏸️ Остановить
                </button>
                <button
                  onClick={() => controlPolling("restart")}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔄 Перезапустить
                </button>
              </>
            )}

            {/* Кнопка переключения режима */}
            <button
              onClick={() => {
                if (botStatus?.currentMode === "polling") {
                  const url = prompt(
                    "Введите URL для webhook (например: https://your-app.vercel.app/api/telegram/webhook):",
                  );
                  if (url) {
                    switchMode("webhook", url);
                  }
                } else {
                  if (confirm("Переключить на polling режим?")) {
                    switchMode("polling");
                  }
                }
              }}
              disabled={loading}
              className="ml-auto px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Переключить на{" "}
              {botStatus?.currentMode === "polling" ? "Webhook" : "Polling"}
            </button>
          </div>
        </div>

        {/* Features Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🚀 Возможности бота
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">
                Регистрация турниров
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">
                Добавление результатов
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">
                OCR распознавание билетов
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">
                Статистика игрока
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">
                Уведомления
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">
                Интеграция с веб-приложением
              </span>
            </div>
          </div>
        </div>

        {/* Test Commands Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🧪 Тестирование команд
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={() => simulateCommand("/start")}
              className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-left hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <code className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                /start
              </code>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Приветствие
              </div>
            </button>

            <button
              onClick={() => simulateCommand("/stats")}
              className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-left hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              <code className="text-green-600 dark:text-green-400 font-mono text-sm">
                /stats
              </code>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Статистика
              </div>
            </button>

            <button
              onClick={() => simulateCommand("/help")}
              className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-left hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              <code className="text-purple-600 dark:text-purple-400 font-mono text-sm">
                /help
              </code>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Справка
              </div>
            </button>

            <button
              onClick={() => simulateCommand("/tournaments")}
              className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-left hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
            >
              <code className="text-orange-600 dark:text-orange-400 font-mono text-sm">
                /tournaments
              </code>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Турниры
              </div>
            </button>

            <button
              onClick={() => simulateCommand("/register")}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <code className="text-red-600 dark:text-red-400 font-mono text-sm">
                /register
              </code>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Регистрация
              </div>
            </button>

            <button
              onClick={() => simulateCommand("/settings")}
              className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <code className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                /settings
              </code>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Настройки
              </div>
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-500">⚡</span>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Симуляция команд:</strong> Нажмите на кнопку команды,
                чтобы протестировать её выполнение. Результат будет отображен в
                консоли сервера.
              </div>
            </div>
          </div>
        </div>

        {/* Commands Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📋 Все команды бота
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <code className="text-blue-600 dark:text-blue-400 font-mono">
                  /start
                </code>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Приветствие и инструкции
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <code className="text-blue-600 dark:text-blue-400 font-mono">
                  /register
                </code>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Регистрация нового турнира
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <code className="text-blue-600 dark:text-blue-400 font-mono">
                  /result
                </code>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Добавление результата турнира
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <code className="text-blue-600 dark:text-blue-400 font-mono">
                  /stats
                </code>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Статистика игрока
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <code className="text-blue-600 dark:text-blue-400 font-mono">
                  /settings
                </code>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Настройки уведомлений
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Environment Variables Info */}
        <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-green-500 text-xl">⚙️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Автоматическая синхронизация из переменных окружения
              </h3>
              <p className="text-green-800 dark:text-green-200 text-sm mb-3">
                Нажмите кнопку{" "}
                <strong>&quot;⚙️ Синхронизировать из .env&quot;</strong> чтобы
                автоматически установить webhook из переменной окружения{" "}
                <code className="bg-green-100 dark:bg-green-800 px-1 rounded">
                  BOT_WEBHOOK_URL
                </code>
                .
              </p>
              <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <div>
                  💡 <strong>Когда использовать:</strong> После деплоя на Vercel
                  или изменения переменных окружения
                </div>
                <div>
                  ✅ <strong>Что делает:</strong> Читает BOT_MODE и
                  BOT_WEBHOOK_URL из .env и автоматически настраивает webhook в
                  Telegram
                </div>
                <div>
                  ⚡ <strong>Преимущество:</strong> Не нужно вручную вводить URL
                  - берется из переменных окружения
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 text-xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Режимы работы бота
              </h3>

              <div className="mt-2 space-y-3">
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                    🔄 Polling режим (Long Polling)
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                    Бот периодически опрашивает сервер Telegram на наличие новых
                    сообщений.
                  </p>
                  <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    <div>
                      • <strong>Преимущества:</strong> Простая настройка,
                      работает локально
                    </div>
                    <div>
                      • <strong>Недостатки:</strong> Больше нагрузки на сервер,
                      задержки в ответах
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                    🔗 Webhook режим
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                    Telegram отправляет обновления напрямую на ваш сервер через
                    webhook URL.
                  </p>
                  <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    <div>
                      • <strong>Преимущества:</strong> Мгновенные ответы, меньше
                      нагрузки на сервер
                    </div>
                    <div>
                      • <strong>Недостатки:</strong> Требует публичный HTTPS URL
                    </div>
                    <div>
                      • <strong>Для продакшена:</strong> ✅ Рекомендуется
                      использовать webhook режим
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
