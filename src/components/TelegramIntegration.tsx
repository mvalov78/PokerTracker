"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

interface TelegramSettings {
  telegramId: string | null;
  isLinked: boolean;
  linkingCode: string;
  isGeneratingCode: boolean;
}

export default function TelegramIntegration() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
    telegramId: null,
    isLinked: false,
    linkingCode: "",
    isGeneratingCode: false,
  });

  // Generate linking code
  const generateLinkingCode = async () => {
    setTelegramSettings((prev) => ({ ...prev, isGeneratingCode: true }));
    try {
      const response = await fetch("/api/telegram/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });

      const result = await response.json();
      if (result.success) {
        setTelegramSettings((prev) => ({
          ...prev,
          linkingCode: result.code,
          isGeneratingCode: false,
        }));
        addToast({
          type: "success",
          message: "Код для связывания создан! Отправьте его боту в Telegram",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      addToast({
        type: "error",
        message: "Ошибка при создании кода связывания",
      });
      setTelegramSettings((prev) => ({ ...prev, isGeneratingCode: false }));
    }
  };

  // Unlink Telegram account
  const unlinkTelegram = async () => {
    if (!confirm("Вы уверены, что хотите отвязать Telegram аккаунт?")) return;

    try {
      const response = await fetch("/api/telegram/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });

      const result = await response.json();
      if (result.success) {
        setTelegramSettings({
          telegramId: null,
          isLinked: false,
          linkingCode: "",
          isGeneratingCode: false,
        });
        addToast({
          type: "success",
          message: "Telegram аккаунт успешно отвязан",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      addToast({
        type: "error",
        message: "Ошибка при отвязке Telegram аккаунта",
      });
    }
  };

  // Check Telegram status
  const checkTelegramStatus = async () => {
    try {
      const response = await fetch(`/api/telegram/status?userId=${user?.id}`);
      const result = await response.json();
      if (result.success && result.telegram) {
        setTelegramSettings((prev) => ({
          ...prev,
          telegramId: result.telegram.telegramId,
          isLinked: true,
        }));
      }
    } catch (error) {
      console.error("Error checking Telegram status:", error);
    }
  };

  // Load Telegram status on component mount
  useEffect(() => {
    if (user?.id) {
      checkTelegramStatus();
    }
  }, [user?.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📱</span>
          <span>Telegram Интеграция</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {telegramSettings.isLinked ? (
          // Already linked
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-800 font-medium">
                  Telegram аккаунт подключен
                </span>
              </div>
              <p className="text-green-700 text-sm mt-2">
                ID: {telegramSettings.telegramId}
              </p>
              <p className="text-green-700 text-sm">
                Теперь вы можете создавать турниры через Telegram бот!
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Доступные возможности:
              </h4>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>Создание турниров через фото билетов</li>
                <li>Быстрое добавление результатов</li>
                <li>Получение уведомлений о турнирах</li>
                <li>Просмотр статистики в боте</li>
              </ul>
            </div>

            <Button
              onClick={unlinkTelegram}
              variant="secondary"
              className="w-full"
            >
              🔗 Отвязать Telegram аккаунт
            </Button>
          </div>
        ) : (
          // Not linked yet
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-blue-800 font-medium">
                  Подключите Telegram для удобства
                </span>
              </div>
              <p className="text-blue-700 text-sm mt-2">
                Создавайте турниры прямо из Telegram, отправляя фото билетов
                боту
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Как подключить:
                </h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Нажмите "Создать код связывания"</li>
                  <li>Найдите бот @YourPokerTrackerBot в Telegram</li>
                  <li>
                    Отправьте боту команду{" "}
                    <code className="bg-gray-100 px-1 rounded">/link КОД</code>
                  </li>
                  <li>Готово! Аккаунты будут связаны</li>
                </ol>
              </div>

              {telegramSettings.linkingCode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-yellow-800">
                        Код для связывания:
                      </p>
                      <code className="text-lg font-mono bg-yellow-100 px-2 py-1 rounded">
                        {telegramSettings.linkingCode}
                      </code>
                    </div>
                    <Button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          telegramSettings.linkingCode,
                        )
                      }
                      variant="secondary"
                      size="sm"
                    >
                      📋 Копировать
                    </Button>
                  </div>
                  <p className="text-yellow-700 text-sm mt-2">
                    Отправьте этот код боту:{" "}
                    <code>/link {telegramSettings.linkingCode}</code>
                  </p>
                </div>
              )}

              <Button
                onClick={generateLinkingCode}
                disabled={telegramSettings.isGeneratingCode}
                className="w-full"
              >
                {telegramSettings.isGeneratingCode ? (
                  <>⏳ Создание кода...</>
                ) : (
                  <>🔗 Создать код связывания</>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

