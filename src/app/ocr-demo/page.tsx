"use client";

import { useState } from "react";
import TicketUpload from "@/components/ocr/TicketUpload";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function OCRDemoPage() {
  const [demoData, setDemoData] = useState<any>(null);

  const handleUploadResult = (result: any) => {
    console.log("OCR Result:", result);
    setDemoData(result);
  };

  const clearDemo = () => {
    setDemoData(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🤖 OCR Демонстрация
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Тестирование системы распознавания билетов турниров
        </p>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📸 Загрузка билета
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Загрузите фотографию билета турнира для автоматического распознавания данных.
                Поддерживаются форматы: JPG, PNG, WebP.
              </p>
              <TicketUpload onUploadResult={handleUploadResult} />
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {demoData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                🔍 Результаты распознавания
              </CardTitle>
              <Button onClick={clearDemo} variant="outline" size="sm">
                Очистить
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoData.success ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                        ✅ Данные успешно распознаны
                      </h3>
                      <div className="grid gap-2 text-sm">
                        <div><strong>Турнир:</strong> {demoData.data?.name || "Не определено"}</div>
                        <div><strong>Дата:</strong> {demoData.data?.date ? new Date(demoData.data.date).toLocaleDateString("ru-RU") : "Не определена"}</div>
                        <div><strong>Бай-ин:</strong> ${demoData.data?.buyin || 0}</div>
                        <div><strong>Площадка:</strong> {demoData.data?.venue || "Не указана"}</div>
                        <div><strong>Тип:</strong> {demoData.data?.tournamentType || "Не определен"}</div>
                        {demoData.data?.structure && (
                          <div><strong>Структура:</strong> {demoData.data.structure}</div>
                        )}
                        {demoData.data?.participants && (
                          <div><strong>Участники:</strong> {demoData.data.participants}</div>
                        )}
                        {demoData.data?.prizePool && (
                          <div><strong>Призовой фонд:</strong> ${demoData.data.prizePool}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        📊 Техническая информация
                      </h4>
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <div><strong>Время обработки:</strong> {demoData.processingTime || "Не измерено"}</div>
                        <div><strong>Уверенность:</strong> {demoData.confidence || "Не определена"}</div>
                        <div><strong>Метод:</strong> {demoData.method || "OCR"}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      ❌ Ошибка распознавания
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {demoData.error || "Не удалось распознать данные на изображении"}
                    </p>
                  </div>
                )}

                {/* Raw Data */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    🔧 Показать сырые данные
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                    {JSON.stringify(demoData, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 Информация о демо
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <strong>Цель:</strong> Демонстрация возможностей системы автоматического распознавания 
                данных с билетов турниров.
              </p>
              <p>
                <strong>Технология:</strong> Система использует OCR (Optical Character Recognition) 
                для извлечения текстовой информации с изображений.
              </p>
              <p>
                <strong>Поддерживаемые данные:</strong> Название турнира, дата, бай-ин, площадка, 
                тип турнира, структура, количество участников, призовой фонд.
              </p>
              <p>
                <strong>Рекомендации:</strong> Для лучших результатов используйте четкие фотографии 
                с хорошим освещением, где весь билет виден полностью.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

