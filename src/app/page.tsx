export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🎰 PokerTracker Pro
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Турниры */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🏆 Турниры</h2>
            <p className="text-gray-600 mb-4">Управление турнирами</p>
            <a
              href="/tournaments"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
            >
              Перейти
            </a>
          </div>

          {/* Банкролл */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">💰 Банкролл</h2>
            <p className="text-gray-600 mb-4">Управление банкроллом</p>
            <a
              href="/bankroll"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
            >
              Перейти
            </a>
          </div>

          {/* Аналитика */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Аналитика</h2>
            <p className="text-gray-600 mb-4">Статистика и графики</p>
            <a
              href="/analytics"
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 inline-block"
            >
              Перейти
            </a>
          </div>

          {/* Результаты */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🏅 Результаты</h2>
            <p className="text-gray-600 mb-4">История результатов</p>
            <a
              href="/results"
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 inline-block"
            >
              Перейти
            </a>
          </div>

          {/* Telegram Bot */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🤖 Telegram Bot</h2>
            <p className="text-gray-600 mb-4">Управление ботом</p>
            <div className="space-y-2">
              <a
                href="/admin/bot"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block w-full text-center"
              >
                Админ панель
              </a>
              <a
                href="/admin/bot-setup"
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 inline-block w-full text-center"
              >
                Настройка
              </a>
            </div>
          </div>

          {/* Настройки */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">⚙️ Настройки</h2>
            <p className="text-gray-600 mb-4">Настройки приложения</p>
            <a
              href="/settings"
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 inline-block"
            >
              Перейти
            </a>
          </div>
        </div>

        {/* Статус */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Статус системы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Приложение:</span>
              <span className="ml-2 text-green-600 font-semibold">
                ✅ Работает
              </span>
            </div>
            <div>
              <span className="text-gray-600">Telegram Bot:</span>
              <span className="ml-2 text-blue-600 font-semibold">
                🔄 Polling режим
              </span>
            </div>
            <div>
              <span className="text-gray-600">База данных:</span>
              <span className="ml-2 text-yellow-600 font-semibold">
                📝 Мок данные
              </span>
            </div>
            <div>
              <span className="text-gray-600">OCR:</span>
              <span className="ml-2 text-green-600 font-semibold">
                ✅ Готов
              </span>
            </div>
          </div>
        </div>

        {/* Инструкции */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">
            📋 Быстрый старт
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Настройте Telegram бота в разделе &quot;Настройка&quot;</li>
            <li>Добавьте первый турнир в разделе &quot;Турниры&quot;</li>
            <li>Протестируйте бота через &quot;Админ панель&quot;</li>
            <li>Просматривайте статистику в &quot;Аналитика&quot;</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
