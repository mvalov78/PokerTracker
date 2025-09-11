"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
// Убираем импорт mock данных - используем только Supabase
import type { Tournament, TournamentFormData } from "@/types";

export default function EditTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState<TournamentFormData>({
    name: "",
    date: "",
    venue: "",
    buyin: 0,
    tournamentType: "freezeout",
    structure: "",
    participants: undefined,
    prizePool: undefined,
    blindLevels: "",
    startingStack: undefined,
    notes: "",
  });

  // Загрузка данных турнира
  useEffect(() => {
    const loadTournament = async () => {
      setIsLoading(true);

      try {
        // Пробуем загрузить через API
        const response = await fetch(`/api/tournaments/${tournamentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const foundTournament = data.tournament;
            setTournament(foundTournament);
            setFormData({
              name: foundTournament.name,
              date: foundTournament.date.split("T")[0], // Конвертируем в формат YYYY-MM-DD
              venue: foundTournament.venue,
              buyin: foundTournament.buyin,
              tournamentType: foundTournament.tournamentType,
              structure: foundTournament.structure || "",
              participants: foundTournament.participants || undefined,
              prizePool: foundTournament.prizePool || undefined,
              blindLevels: foundTournament.blindLevels || "",
              startingStack: foundTournament.startingStack || undefined,
              notes: foundTournament.notes || "",
            });
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Ошибка загрузки турнира через API:", error);
        // Турнир не найден, перенаправляем на список
        router.push("/tournaments");
        return;
      }

      // Если API не вернул данные, турнир не найден
      router.push("/tournaments");
    };

    loadTournament();
  }, [tournamentId, router]);

  const handleInputChange = (field: keyof TournamentFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!tournament) {
        alert("Турнир не найден");
        return;
      }

      // Подготавливаем данные для обновления
      const updateData = {
        name: formData.name,
        date: new Date(formData.date).toISOString(),
        venue: formData.venue,
        buyin: formData.buyin,
        tournamentType: formData.tournamentType,
        structure: formData.structure,
        participants: formData.participants,
        prizePool: formData.prizePool,
        blindLevels: formData.blindLevels,
        startingStack: formData.startingStack,
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
      };

      try {
        // Пробуем обновить через API
        const response = await fetch(`/api/tournaments/${tournamentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log("Турнир успешно обновлен через API:", data.tournament);
            alert("Турнир успешно обновлен!");
            router.push("/tournaments");
            return;
          }
        }

        throw new Error("Не удалось обновить турнир через API");
      } catch (apiError) {
        console.error("Ошибка обновления через API:", apiError);
        throw apiError;
      }
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      alert("Ошибка при сохранении турнира");
    } finally {
      setIsLoading(false);
    }
  };

  const tournamentTypeOptions = [
    { value: "freezeout", label: "Freezeout" },
    { value: "rebuy", label: "Rebuy" },
    { value: "addon", label: "Add-on" },
    { value: "bounty", label: "Bounty" },
    { value: "satellite", label: "Satellite" },
  ];

  // Показываем загрузку пока данные не загружены
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Загружаем данные турнира...
            </h3>
            <p className="text-gray-500">Пожалуйста, подождите</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <a href="/" className="hover:text-blue-600">
              Главная
            </a>
            <span className="mx-2">→</span>
            <a href="/tournaments" className="hover:text-blue-600">
              Турниры
            </a>
            <span className="mx-2">→</span>
            <span>Редактирование</span>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ✏️ Редактирование турнира
          </h1>
          <p className="text-gray-600">
            {tournament
              ? `Обновите информацию о турнире "${tournament.name}"`
              : "Обновите информацию о турнире"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Основная информация
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название турнира *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата и время *
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Площадка *
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => handleInputChange("venue", e.target.value)}
                  placeholder="PokerStars, PartyPoker, Live Casino..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Бай-ин ($) *
                </label>
                <input
                  type="number"
                  value={formData.buyin}
                  onChange={(e) =>
                    handleInputChange("buyin", parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип турнира *
                </label>
                <select
                  value={formData.tournamentType}
                  onChange={(e) =>
                    handleInputChange("tournamentType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {tournamentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Структура
                </label>
                <input
                  type="text"
                  value={formData.structure}
                  onChange={(e) =>
                    handleInputChange("structure", e.target.value)
                  }
                  placeholder="Regular, Turbo, Hyper..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Дополнительная информация
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество участников
                  </label>
                  <input
                    type="number"
                    value={formData.participants || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "participants",
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Призовой фонд ($)
                  </label>
                  <input
                    type="number"
                    value={formData.prizePool || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "prizePool",
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Стартовый стек
                  </label>
                  <input
                    type="number"
                    value={formData.startingStack || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "startingStack",
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Структура блайндов
                  </label>
                  <input
                    type="text"
                    value={formData.blindLevels || ""}
                    onChange={(e) =>
                      handleInputChange("blindLevels", e.target.value)
                    }
                    placeholder="10/20, 15/30, 25/50..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Заметки
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={4}
                  placeholder="Дополнительные заметки о турнире..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push("/tournaments")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отменить
              </button>

              <button
                type="button"
                onClick={() => router.push(`/tournaments/${tournamentId}`)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Просмотр турнира
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Сохранение..." : "Сохранить изменения"}
              </button>
            </div>
          </form>
        </div>

        {/* Back to tournaments */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/tournaments")}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Вернуться к турнирам
          </button>
        </div>
      </div>
    </div>
  );
}
