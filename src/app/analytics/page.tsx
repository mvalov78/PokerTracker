"use client";

import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProtectedRoute, useAuth } from "@/hooks/useAuth";
import { useTournaments } from "@/hooks/useTournaments";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function AnalyticsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { tournaments, isLoading, error } = useTournaments(user?.id);
  const [timeRange, setTimeRange] = useState("all");

  // Фильтруем турниры по временному диапазону
  const filteredTournaments = useMemo(() => {
    if (timeRange === "all") {
      return tournaments;
    }

    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return tournaments.filter(
      (tournament) => new Date(tournament.date) >= startDate,
    );
  }, [tournaments, timeRange]);

  // Турниры с результатами
  const tournamentsWithResults = useMemo(() => {
    return filteredTournaments.filter((tournament) => tournament.result);
  }, [filteredTournaments]);

  // Основная статистика
  const stats = useMemo(() => {
    const totalTournaments = filteredTournaments.length;
    const totalBuyins = filteredTournaments.reduce(
      (sum, t) => sum + t.buyin,
      0,
    );
    const totalWinnings = tournamentsWithResults.reduce(
      (sum, t) => sum + (t.result?.payout || 0),
      0,
    );

    // ПРАВИЛЬНЫЙ расчет: учитываем ВСЕ турниры для ROI
    // Турниры без результатов = потерянные бай-ины (0 выигрыша)
    const profit = totalWinnings - totalBuyins;
    const roi = totalBuyins > 0 ? (profit / totalBuyins) * 100 : 0;

    // ПРАВИЛЬНЫЙ расчет ITM: от ВСЕХ турниров
    // Турниры без результатов = не попали в деньги (ITM = 0)
    const cashCount = tournamentsWithResults.filter((t) => {
      const position = t.result?.position || 999;
      const participants = t.participants;

      if (participants && participants > 0) {
        // Если знаем количество участников, используем правило 15%
        return position <= participants * 0.15;
      } else {
        // Если не знаем участников, считаем ITM по прибыли (payout > buyin)
        const payout = t.result?.payout || 0;
        return payout > t.buyin;
      }
    }).length;

    // ITM - процент от ВСЕХ турниров, где попали в деньги
    const itm = totalTournaments > 0 ? (cashCount / totalTournaments) * 100 : 0;

    const avgPosition =
      tournamentsWithResults.length > 0
        ? tournamentsWithResults.reduce(
            (sum, t) => sum + (t.result?.position || 0),
            0,
          ) / tournamentsWithResults.length
        : 0;

    const bestFinish =
      tournamentsWithResults.length > 0
        ? Math.min(
            ...tournamentsWithResults.map((t) => t.result?.position || 999),
          )
        : 0;

    const worstFinish =
      tournamentsWithResults.length > 0
        ? Math.max(
            ...tournamentsWithResults.map((t) => t.result?.position || 0),
          )
        : 0;

    return {
      totalTournaments,
      totalBuyins,
      totalWinnings,
      profit,
      roi,
      itm,
      avgPosition,
      bestFinish: bestFinish === 999 ? 0 : bestFinish,
      worstFinish,
    };
  }, [filteredTournaments, tournamentsWithResults]);

  // Анализ по типам турниров
  const tournamentTypeAnalysis = useMemo(() => {
    const typeMap = new Map();

    filteredTournaments.forEach((tournament) => {
      const type = tournament.type || "tournament";
      const existing = typeMap.get(type) || { type, count: 0, profit: 0 };

      existing.count += 1;
      existing.profit += tournament.result?.profit || -tournament.buyin;

      typeMap.set(type, existing);
    });

    return Array.from(typeMap.values()).sort((a, b) => b.count - a.count);
  }, [filteredTournaments]);

  // Анализ по площадкам
  const venueAnalysis = useMemo(() => {
    const venueMap = new Map();

    filteredTournaments.forEach((tournament) => {
      const venue = tournament.venue;
      const existing = venueMap.get(venue) || { venue, count: 0, profit: 0 };

      existing.count += 1;
      existing.profit += tournament.result?.profit || -tournament.buyin;

      venueMap.set(venue, existing);
    });

    return Array.from(venueMap.values()).sort((a, b) => b.count - a.count);
  }, [filteredTournaments]);

  // Последние результаты
  const recentResults = useMemo(() => {
    return tournamentsWithResults
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
      .map((tournament) => ({
        date: tournament.date,
        tournament: tournament.name,
        position: tournament.result?.position || 0,
        profit: tournament.result?.profit || 0,
      }));
  }, [tournamentsWithResults]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Загрузка аналитики...
            </h3>
            <p className="text-gray-600">Получаем данные из базы данных</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Ошибка загрузки данных
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              🔄 Попробовать снова
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Аналитика и статистика
          </h1>
          <p className="text-gray-600">
            Детальный анализ ваших покерных результатов
          </p>
        </div>

        {/* Time Range Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Период анализа
              </h2>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все время</option>
                <option value="year">Текущий год</option>
                <option value="month">Текущий месяц</option>
                <option value="week">Текущая неделя</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalTournaments}
              </div>
              <div className="text-gray-600">Всего турниров</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {formatCurrency(stats.totalBuyins)}
              </div>
              <div className="text-gray-600">Общие бай-ины</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(stats.totalWinnings)}
              </div>
              <div className="text-gray-600">Общие выигрыши</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div
                className={`text-3xl font-bold mb-2 ${
                  stats.profit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(stats.profit)}
              </div>
              <div className="text-gray-600">Общая прибыль</div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <div
                className={`text-3xl font-bold mb-2 ${
                  stats.roi >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.roi >= 0 ? "+" : ""}
                {stats.roi.toFixed(1)}%
              </div>
              <div className="text-gray-600">ROI</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.itm.toFixed(1)}%
              </div>
              <div className="text-gray-600">ITM</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.avgPosition.toFixed(1)}
              </div>
              <div className="text-gray-600">Среднее место</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                🥇 {stats.bestFinish || "-"}
              </div>
              <div className="text-gray-600">Лучший результат</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-gray-600 mb-2">
                {stats.worstFinish || "-"}
              </div>
              <div className="text-gray-600">Худший результат</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tournament Types Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Анализ по типам турниров</CardTitle>
            </CardHeader>
            <CardContent>
              {tournamentTypeAnalysis.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Нет данных для анализа</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {tournamentTypeAnalysis.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="font-medium">{item.type}</span>
                        <span className="text-gray-500">
                          ({item.count} турниров)
                        </span>
                      </div>
                      <div
                        className={`font-semibold ${
                          item.profit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(item.profit)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Venues Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Анализ по площадкам</CardTitle>
            </CardHeader>
            <CardContent>
              {venueAnalysis.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Нет данных для анализа</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {venueAnalysis.map((item) => (
                    <div
                      key={item.venue}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="font-medium">{item.venue}</span>
                        <span className="text-gray-500">
                          ({item.count} турниров)
                        </span>
                      </div>
                      <div
                        className={`font-semibold ${
                          item.profit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(item.profit)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Results */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Последние результаты</CardTitle>
          </CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Нет завершенных турниров</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Турнир
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Место
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Прибыль
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentResults.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(result.date).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.tournament}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          #{result.position}
                          {result.position === 1 && " 🥇"}
                          {result.position === 2 && " 🥈"}
                          {result.position === 3 && " 🥉"}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                            result.profit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(result.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={() => router.push("/tournaments")} variant="primary">
            🎰 Перейти к турнирам
          </Button>
          <Button onClick={() => router.push("/bankroll")} variant="primary">
            💰 Управление банкроллом
          </Button>
          <Button onClick={() => router.push("/")} variant="outline">
            ← Вернуться на главную
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}
