"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface BotSettings {
  bot_mode: string;
  bot_status: string;
  webhook_url: string;
  polling_enabled: string;
  webhook_enabled: string;
  last_update_time: string;
  error_count: string;
}

interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

export default function BotModeManager() {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");

  // Загрузка текущих настроек
  const loadBotSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/bot-mode");
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        setWebhookInfo(data.webhookInfo);
        setWebhookUrl(
          data.settings.webhook_url ||
            window.location.origin + "/api/bot/webhook",
        );
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки настроек");
    } finally {
      setIsLoading(false);
    }
  };

  // Переключение режима
  const switchMode = async (mode: "polling" | "webhook") => {
    try {
      setIsSwitching(true);
      setError(null);

      const requestBody: any = { mode };
      if (mode === "webhook") {
        requestBody.webhookUrl = webhookUrl;
      }

      const response = await fetch("/api/admin/bot-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        await loadBotSettings(); // Перезагружаем настройки
        alert(`✅ ${data.message}`);
      } else {
        setError(data.error);
        alert(`❌ Ошибка: ${data.error}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка переключения режима";
      setError(errorMessage);
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsSwitching(false);
    }
  };

  // Проверка webhook
  const testWebhook = async () => {
    try {
      const response = await fetch(webhookUrl);
      const data = await response.json();

      if (data.status === "ok") {
        alert("✅ Webhook работает корректно");
      } else {
        alert("❌ Webhook не отвечает");
      }
    } catch (err) {
      alert("❌ Ошибка проверки webhook");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadBotSettings();

      // Автообновление каждые 30 секунд
      const interval = setInterval(loadBotSettings, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">
          Доступ запрещен. Требуются права администратора.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-center text-gray-600 mt-2">
          Загрузка настроек бота...
        </p>
      </div>
    );
  }

  const currentMode = settings?.bot_mode || "unknown";
  const botStatus = settings?.bot_status || "inactive";
  const isPollingMode = currentMode === "polling";
  const isWebhookMode = currentMode === "webhook";

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🤖 Управление Telegram ботом
        </h2>
        <p className="text-gray-600">
          Переключение между polling и webhook режимами
        </p>
      </div>

      {/* Текущий статус */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Текущий статус
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">
              Режим работы
            </div>
            <div
              className={`text-lg font-bold ${isPollingMode ? "text-blue-600" : isWebhookMode ? "text-green-600" : "text-gray-600"}`}
            >
              {currentMode === "polling" && "🔄 Polling"}
              {currentMode === "webhook" && "🔗 Webhook"}
              {currentMode === "unknown" && "❓ Неизвестно"}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Статус бота</div>
            <div
              className={`text-lg font-bold ${
                botStatus === "active"
                  ? "text-green-600"
                  : botStatus === "error"
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {botStatus === "active" && "✅ Активен"}
              {botStatus === "inactive" && "⏸️ Неактивен"}
              {botStatus === "error" && "❌ Ошибка"}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Ошибки</div>
            <div
              className={`text-lg font-bold ${
                parseInt(settings?.error_count || "0") > 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {settings?.error_count || "0"} за час
            </div>
          </div>
        </div>
      </div>

      {/* Webhook информация */}
      {isWebhookMode && webhookInfo && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔗 Webhook информация
          </h3>

          <div className="space-y-2 text-sm">
            <div>
              <strong>URL:</strong>{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {webhookInfo.url}
              </code>
            </div>
            <div>
              <strong>Ожидающие обновления:</strong>{" "}
              {webhookInfo.pending_update_count}
            </div>
            <div>
              <strong>Максимум соединений:</strong>{" "}
              {webhookInfo.max_connections}
            </div>

            {webhookInfo.last_error_date && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
                <div>
                  <strong>Последняя ошибка:</strong>{" "}
                  {new Date(
                    webhookInfo.last_error_date * 1000,
                  ).toLocaleString()}
                </div>
                <div className="text-red-600">
                  {webhookInfo.last_error_message}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ошибки */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">❌ {error}</p>
        </div>
      )}

      {/* Управление режимами */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚙️ Переключение режимов
        </h3>

        <div className="space-y-6">
          {/* Polling режим */}
          <div
            className={`border-2 rounded-lg p-4 ${isPollingMode ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  🔄 Polling режим
                </h4>
                <p className="text-gray-600">
                  Бот опрашивает Telegram сервер каждые несколько секунд
                </p>
                <div className="text-sm text-gray-500 mt-2">
                  <strong>Преимущества:</strong> Простота настройки, работает
                  везде
                  <br />
                  <strong>Недостатки:</strong> Больше ресурсов, задержка в
                  ответах
                </div>
              </div>

              <button
                onClick={() => switchMode("polling")}
                disabled={isSwitching || isPollingMode}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isPollingMode
                    ? "bg-blue-100 text-blue-600 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                } ${isSwitching ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSwitching
                  ? "⏳ Переключение..."
                  : isPollingMode
                    ? "✅ Активен"
                    : "Включить Polling"}
              </button>
            </div>
          </div>

          {/* Webhook режим */}
          <div
            className={`border-2 rounded-lg p-4 ${isWebhookMode ? "border-green-500 bg-green-50" : "border-gray-200"}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    🔗 Webhook режим
                  </h4>
                  <p className="text-gray-600">
                    Telegram отправляет обновления напрямую на ваш сервер
                  </p>
                  <div className="text-sm text-gray-500 mt-2">
                    <strong>Преимущества:</strong> Мгновенные ответы, меньше
                    ресурсов
                    <br />
                    <strong>Недостатки:</strong> Требует HTTPS, настройка
                    сложнее
                  </div>
                </div>

                <button
                  onClick={() => switchMode("webhook")}
                  disabled={isSwitching || isWebhookMode}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    isWebhookMode
                      ? "bg-green-100 text-green-600 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600"
                  } ${isSwitching ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isSwitching
                    ? "⏳ Переключение..."
                    : isWebhookMode
                      ? "✅ Активен"
                      : "Включить Webhook"}
                </button>
              </div>

              {/* Настройка URL для webhook */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-app.vercel.app/api/bot/webhook"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={testWebhook}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    🧪 Тест
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  URL должен быть доступен по HTTPS и отвечать на POST запросы
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Дополнительные настройки */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔧 Дополнительные настройки
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">
                Автоматический перезапуск
              </div>
              <div className="text-sm text-gray-600">
                Перезапускать бота при ошибках
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.auto_restart === "true"}
                onChange={(e) =>
                  updateSetting("auto_restart", e.target.checked.toString())
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Действия */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎮 Действия
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={loadBotSettings}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            🔄 Обновить статус
          </button>

          <button
            onClick={() => window.open("/api/bot/webhook", "_blank")}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            🧪 Тест webhook
          </button>

          <button
            onClick={() => restartBot()}
            disabled={isSwitching}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            🔄 Перезапуск бота
          </button>

          <button
            onClick={() => viewLogs()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            📋 Логи бота
          </button>
        </div>
      </div>

      {/* Справка */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Справка</h3>

        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <strong>Polling режим:</strong> Рекомендуется для разработки и
            тестирования. Бот сам опрашивает Telegram сервер на наличие новых
            сообщений.
          </div>

          <div>
            <strong>Webhook режим:</strong> Рекомендуется для продакшена.
            Telegram отправляет обновления напрямую на ваш сервер через HTTPS.
          </div>

          <div>
            <strong>Переключение:</strong> При переключении режимов бот
            автоматически останавливается и перезапускается в новом режиме.
          </div>
        </div>
      </div>
    </div>
  );

  // Вспомогательные функции
  async function updateSetting(key: string, value: string) {
    try {
      const response = await fetch("/api/admin/bot-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingKey: key, settingValue: value }),
      });

      const data = await response.json();

      if (data.success) {
        await loadBotSettings();
      } else {
        alert(`Ошибка обновления настройки: ${data.error}`);
      }
    } catch (err) {
      alert(`Ошибка: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  async function restartBot() {
    if (confirm("Перезапустить бота? Это может прервать текущие операции.")) {
      await switchMode(currentMode as "polling" | "webhook");
    }
  }

  function viewLogs() {
    // В реальном приложении здесь был бы переход к логам
    alert("Логи бота доступны в консоли сервера и Vercel Dashboard");
  }
}
