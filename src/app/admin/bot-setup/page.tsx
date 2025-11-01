"use client";

/**
 * Страница настройки токена Telegram бота
 */

import { useState } from "react";

export default function BotSetupPage() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      setMessage("❌ Введите токен бота");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      // Здесь можно добавить валидацию токена через Telegram API
      setMessage(`✅ Токен сохранен! Обновите файл .env.local:
TELEGRAM_BOT_TOKEN=${token}

Затем перезапустите сервер разработки.`);
    } catch (error) {
      setMessage("❌ Ошибка проверки токена");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🤖 Настройка Telegram Бота
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Введите токен от BotFather для подключения реального бота
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📋 Инструкция по получению токена:
          </h2>
          <ol className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
            <li>
              1. Откройте Telegram и найдите бота{" "}
              <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
                @BotFather
              </code>
            </li>
            <li>
              2. Отправьте команду{" "}
              <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
                /newbot
              </code>
            </li>
            <li>3. Следуйте инструкциям для создания нового бота</li>
            <li>
              4. Скопируйте полученный токен (формат:{" "}
              <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
                123456789:ABCdefGhiJklmNoPQRsTuVwXyZ
              </code>
              )
            </li>
            <li>5. Вставьте токен в поле ниже</li>
          </ol>
        </div>

        {/* Token Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="token"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Токен бота:
              </label>
              <input
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456789:ABCdefGhiJklmNoPQRsTuVwXyZ"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !token.trim()}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "🔄 Проверка..." : "✅ Сохранить токен"}
            </button>
          </form>

          {message && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {message}
              </pre>
            </div>
          )}
        </div>

        {/* Current Status */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Текущий статус
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Режим:</span>
              <span className="text-gray-900 dark:text-white font-mono">
                Polling (Long Polling)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Токен:</span>
              <span className="text-gray-900 dark:text-white">
                {process.env.NEXT_PUBLIC_BOT_TOKEN ? "Настроен" : "Не настроен"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Библиотека:
              </span>
              <span className="text-green-600 dark:text-green-400">
                Telegraf ✅
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex space-x-3">
              <a
                href="/admin/bot"
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                🎛️ Админ панель
              </a>
              <a
                href="/"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                🏠 Главная
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
