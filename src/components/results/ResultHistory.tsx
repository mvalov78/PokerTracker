"use client";

import { useMemo } from "react";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ResultChangeHistory } from "@/types";
import { getResultHistory, getTournamentById } from "@/data/mockData";

interface ResultHistoryProps {
  userId: string;
  tournamentId?: string;
  maxItems?: number;
  showTournamentName?: boolean;
}

export default function ResultHistory({
  userId,
  tournamentId,
  maxItems = 10,
  showTournamentName = true,
}: ResultHistoryProps) {
  const history = useMemo(() => {
    const allHistory = getResultHistory(userId, tournamentId);
    return maxItems ? allHistory.slice(0, maxItems) : allHistory;
  }, [userId, tournamentId, maxItems]);

  const getChangeIcon = (changeType: ResultChangeHistory["changeType"]) => {
    switch (changeType) {
      case "created":
        return "✅";
      case "updated":
        return "✏️";
      case "deleted":
        return "🗑️";
      default:
        return "📝";
    }
  };

  const getChangeColor = (changeType: ResultChangeHistory["changeType"]) => {
    switch (changeType) {
      case "created":
        return "text-green-600 dark:text-green-400";
      case "updated":
        return "text-blue-600 dark:text-blue-400";
      case "deleted":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const formatFieldName = (field: string) => {
    const fieldNames: { [key: string]: string } = {
      position: "Позиция",
      payout: "Выплата",
      profit: "Прибыль",
      roi: "ROI",
      notes: "Комментарии",
      knockouts: "Нокауты",
      rebuyCount: "Ребаи",
      addonCount: "Аддоны",
      timeEliminated: "Время вылета",
      finalTableReached: "Финальный стол",
    };
    return fieldNames[field] || field;
  };

  const formatValue = (field: string, value: any) => {
    if (value === null || value === undefined) {
      return "-";
    }

    switch (field) {
      case "payout":
      case "profit":
        return new Intl.NumberFormat("ru-RU", {
          style: "currency",
          currency: "USD",
        }).format(value);
      case "roi":
        return `${Number(value).toFixed(1)}%`;
      case "finalTableReached":
        return value ? "Да" : "Нет";
      default:
        return String(value);
    }
  };

  // Функция для получения имени турнира по ID
  const getTournamentName = (tournamentId: string) => {
    const tournament = getTournamentById(tournamentId);
    return tournament?.name || `Турнир ${tournamentId}`;
  };

  const renderFieldChanges = (entry: ResultChangeHistory) => {
    if (entry.changeType === "created" || entry.changeType === "deleted") {
      return null; // Для создания и удаления не показываем изменения полей
    }

    if (!entry.changedFields?.length) {
      return <div className="text-sm">Детали изменений недоступны</div>;
    }

    return (
      <div className="space-y-1">
        {entry.changedFields.map((field) => {
          const oldValue = entry.oldData?.[field as keyof typeof entry.oldData];
          const newValue = entry.newData?.[field as keyof typeof entry.newData];

          return (
            <div key={field} className="text-sm grid grid-cols-3">
              <div className="font-medium">{formatFieldName(field)}</div>
              <div className="text-red-600 dark:text-red-400 line-through">
                {formatValue(field, oldValue)}
              </div>
              <div className="text-green-600 dark:text-green-400">
                {formatValue(field, newValue)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📝</span>
          <span>История изменений</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              История пуста
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Изменения результатов будут отображаться здесь
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getChangeIcon(entry.changeType)}
                    </div>
                    <div>
                      <div
                        className={`font-semibold ${getChangeColor(entry.changeType)}`}
                      >
                        {entry.changeType === "created" && "Результат добавлен"}
                        {entry.changeType === "updated" && "Результат обновлен"}
                        {entry.changeType === "deleted" && "Результат удален"}
                      </div>
                      {showTournamentName && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {getTournamentName(entry.tournamentId)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(entry.timestamp).toLocaleDateString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(entry.timestamp).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                {renderFieldChanges(entry)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
