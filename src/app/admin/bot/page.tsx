"use client";

/**
 * Страница управления Telegram ботом
 */

export default function BotManagementPage() {
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
      } else {
        alert(`❌ Ошибка: ${result.error}`);
      }
    } catch (error) {
      alert("❌ Ошибка подключения к боту");
      console.error("Ошибка управления polling:", error);
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

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🤖 Управление Telegram Ботом
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Мониторинг и управление Telegram ботом для PokerTracker Pro
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📡 Статус Бота (Polling режим)
          </h2>

          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">🔄</span>
            <div>
              <div className="font-semibold text-blue-600 dark:text-blue-400">
                Polling режим активен
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Бот опрашивает сервер Telegram каждые 30 секунд
              </div>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => controlPolling("start")}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              ▶️ Запустить
            </button>
            <button
              onClick={() => controlPolling("stop")}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              ⏸️ Остановить
            </button>
            <button
              onClick={() => controlPolling("restart")}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              🔄 Перезапустить
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

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 text-xl">🔄</span>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Polling режим (Long Polling)
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Бот работает в режиме polling - периодически опрашивает сервер
                Telegram на наличие новых сообщений. Это проще для разработки,
                не требует настройки webhook и внешнего URL.
              </p>
              <div className="mt-2 space-y-1 text-xs text-blue-700 dark:text-blue-300">
                <div>
                  • <strong>Преимущества:</strong> Простая настройка, работает
                  локально
                </div>
                <div>
                  • <strong>Недостатки:</strong> Больше нагрузки на сервер,
                  задержки в ответах
                </div>
                <div>
                  • <strong>Для продакшена:</strong> Рекомендуется использовать
                  webhook режим
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
