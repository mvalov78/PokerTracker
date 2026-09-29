"use client";

import { useState } from "react";
import { useAuth, ProtectedRoute } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input, { Select, Textarea } from "@/components/ui/Input";
import { Breadcrumbs } from "@/components/ui/Navigation";
import { useToast } from "@/components/ui/Toast";

function SettingsContent() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  // Profile Settings
  const [profileSettings, setProfileSettings] = useState({
    username: profile?.username || user?.email?.split("@")[0] || "",
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
    location: user?.location || "",
    timezone: user?.timezone || "UTC",
    language: user?.language || "ru",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      tournaments: true,
      results: true,
      bankroll: true,
      weekly: true,
    },
    telegram: {
      tournaments: false,
      results: false,
      bankroll: false,
      instant: false,
    },
    push: {
      enabled: false,
      tournaments: false,
      results: false,
    },
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: false,
    showRealName: false,
    shareStatistics: false,
    allowAnalytics: true,
  });

  // App Settings
  const [appSettings, setAppSettings] = useState({
    theme: "dark",
    currency: "USD",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    compactMode: false,
    showAnimations: true,
    autoSave: true,
  });

  const handleProfileChange = (field: string, value: any) => {
    setProfileSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (
    category: string,
    field: string,
    value: boolean,
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handlePrivacyChange = (field: string, value: boolean) => {
    setPrivacySettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleAppSettingsChange = (field: string, value: any) => {
    setAppSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      // Симуляция сохранения настроек
      await new Promise((resolve) => setTimeout(resolve, 1500));

      addToast({
        type: "success",
        message: "Настройки успешно сохранены!",
      });
    } catch (error) {
      addToast({
        type: "error",
        message: "Ошибка при сохранении настроек",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      // Симуляция экспорта данных
      addToast({
        type: "info",
        message: "Подготовка данных для экспорта...",
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // В реальном приложении здесь был бы реальный экспорт
      const exportData = {
        tournaments: "mock_tournaments_data",
        bankroll: "mock_bankroll_data",
        settings: "mock_settings_data",
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `poker-tracker-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();

      addToast({
        type: "success",
        message: "Данные успешно экспортированы!",
      });
    } catch (error) {
      addToast({
        type: "error",
        message: "Ошибка при экспорте данных",
      });
    }
  };

  const handleResetSettings = () => {
    if (
      confirm(
        "Вы уверены, что хотите сбросить все настройки? Это действие нельзя отменить.",
      )
    ) {
      setProfileSettings({
        username: profile?.username || user?.email?.split("@")[0] || "",
        email: user?.email || "",
        firstName: "",
        lastName: "",
        bio: "",
        location: "",
        timezone: "UTC",
        language: "ru",
      });

      setNotificationSettings({
        email: {
          tournaments: true,
          results: true,
          bankroll: true,
          weekly: true,
        },
        telegram: {
          tournaments: false,
          results: false,
          bankroll: false,
          instant: false,
        },
        push: { enabled: false, tournaments: false, results: false },
      });

      setPrivacySettings({
        profilePublic: false,
        showRealName: false,
        shareStatistics: false,
        allowAnalytics: true,
      });

      setAppSettings({
        theme: "dark",
        currency: "USD",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "24h",
        compactMode: false,
        showAnimations: true,
        autoSave: true,
      });

      addToast({
        type: "success",
        message: "Настройки сброшены к значениям по умолчанию",
      });
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[{ label: "Главная", href: "/" }, { label: "Настройки" }]}
          className="mb-6"
        />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⚙️ Настройки
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Персонализируйте свой опыт использования приложения
          </p>
        </div>

        <div className="space-y-8">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>👤</span>
                <span>Профиль</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Имя пользователя"
                  value={profileSettings.username}
                  onChange={(e) =>
                    handleProfileChange("username", e.target.value)
                  }
                />

                <Input
                  type="email"
                  label="Email"
                  value={profileSettings.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                />

                <Input
                  label="Имя"
                  value={profileSettings.firstName}
                  onChange={(e) =>
                    handleProfileChange("firstName", e.target.value)
                  }
                />

                <Input
                  label="Фамилия"
                  value={profileSettings.lastName}
                  onChange={(e) =>
                    handleProfileChange("lastName", e.target.value)
                  }
                />

                <Input
                  label="Местоположение"
                  value={profileSettings.location}
                  onChange={(e) =>
                    handleProfileChange("location", e.target.value)
                  }
                />

                <Select
                  label="Часовой пояс"
                  value={profileSettings.timezone}
                  onChange={(e) =>
                    handleProfileChange("timezone", e.target.value)
                  }
                  options={[
                    { value: "UTC", label: "UTC" },
                    { value: "Europe/Moscow", label: "Москва (UTC+3)" },
                    { value: "Europe/London", label: "Лондон (UTC+0)" },
                    { value: "America/New_York", label: "Нью-Йорк (UTC-5)" },
                    {
                      value: "America/Los_Angeles",
                      label: "Лос-Анджелес (UTC-8)",
                    },
                  ]}
                />
              </div>

              <Textarea
                label="О себе"
                placeholder="Расскажите о своем опыте в покере..."
                value={profileSettings.bio}
                onChange={(e) => handleProfileChange("bio", e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🎨</span>
                <span>Интерфейс</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Тема"
                  value={appSettings.theme}
                  onChange={(e) =>
                    handleAppSettingsChange("theme", e.target.value)
                  }
                  options={[
                    { value: "light", label: "Светлая" },
                    { value: "dark", label: "Темная" },
                    { value: "auto", label: "Системная" },
                  ]}
                />

                <Select
                  label="Валюта"
                  value={appSettings.currency}
                  onChange={(e) =>
                    handleAppSettingsChange("currency", e.target.value)
                  }
                  options={[
                    { value: "USD", label: "Доллар США ($)" },
                    { value: "EUR", label: "Евро (€)" },
                    { value: "RUB", label: "Российский рубль (₽)" },
                    { value: "GBP", label: "Фунт стерлингов (£)" },
                  ]}
                />

                <Select
                  label="Формат даты"
                  value={appSettings.dateFormat}
                  onChange={(e) =>
                    handleAppSettingsChange("dateFormat", e.target.value)
                  }
                  options={[
                    { value: "DD/MM/YYYY", label: "ДД/ММ/ГГГГ" },
                    { value: "MM/DD/YYYY", label: "ММ/ДД/ГГГГ" },
                    { value: "YYYY-MM-DD", label: "ГГГГ-ММ-ДД" },
                  ]}
                />

                <Select
                  label="Формат времени"
                  value={appSettings.timeFormat}
                  onChange={(e) =>
                    handleAppSettingsChange("timeFormat", e.target.value)
                  }
                  options={[
                    { value: "24h", label: "24-часовой" },
                    { value: "12h", label: "12-часовой (AM/PM)" },
                  ]}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="compactMode"
                    checked={appSettings.compactMode}
                    onChange={(e) =>
                      handleAppSettingsChange("compactMode", e.target.checked)
                    }
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="compactMode"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Компактный режим интерфейса
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showAnimations"
                    checked={appSettings.showAnimations}
                    onChange={(e) =>
                      handleAppSettingsChange(
                        "showAnimations",
                        e.target.checked,
                      )
                    }
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="showAnimations"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Показывать анимации
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={appSettings.autoSave}
                    onChange={(e) =>
                      handleAppSettingsChange("autoSave", e.target.checked)
                    }
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="autoSave"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Автоматическое сохранение
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔔</span>
                <span>Уведомления</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Email уведомления
                </h4>
                <div className="space-y-3">
                  {Object.entries(notificationSettings.email).map(
                    ([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`email-${key}`}
                          checked={value}
                          onChange={(e) =>
                            handleNotificationChange(
                              "email",
                              key,
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label
                          htmlFor={`email-${key}`}
                          className="text-sm font-medium text-gray-900 dark:text-white"
                        >
                          {key === "tournaments" && "Новые турниры"}
                          {key === "results" && "Результаты турниров"}
                          {key === "bankroll" && "Изменения банкролла"}
                          {key === "weekly" && "Еженедельные отчеты"}
                        </label>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Push уведомления
                </h4>
                <div className="space-y-3">
                  {Object.entries(notificationSettings.push).map(
                    ([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`push-${key}`}
                          checked={value}
                          onChange={(e) =>
                            handleNotificationChange(
                              "push",
                              key,
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label
                          htmlFor={`push-${key}`}
                          className="text-sm font-medium text-gray-900 dark:text-white"
                        >
                          {key === "enabled" && "Включить push уведомления"}
                          {key === "tournaments" && "Турниры"}
                          {key === "results" && "Результаты"}
                        </label>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔒</span>
                <span>Приватность</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(privacySettings).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) =>
                        handlePrivacyChange(key, e.target.checked)
                      }
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor={key}
                      className="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {key === "profilePublic" && "Публичный профиль"}
                      {key === "showRealName" && "Показывать реальное имя"}
                      {key === "shareStatistics" && "Делиться статистикой"}
                      {key === "allowAnalytics" && "Разрешить аналитику"}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>💾</span>
                <span>Управление данными</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Экспорт данных
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Скачайте все ваши данные в формате JSON
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  >
                    📥 Экспорт
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100">
                      Сброс настроек
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Вернуть все настройки к значениям по умолчанию
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleResetSettings}
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    🔄 Сбросить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-8">
            <Button variant="outline" onClick={() => window.history.back()}>
              ← Назад
            </Button>
            <Button
              onClick={handleSaveSettings}
              loading={isLoading}
              className="bg-emerald-500 hover:bg-emerald-600 min-w-[200px]"
            >
              {isLoading ? "Сохраняем..." : "💾 Сохранить настройки"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
