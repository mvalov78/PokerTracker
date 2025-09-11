import type {
  User,
  Tournament,
  TournamentResult,
  UserStats,
  BankrollTransaction,
  BankrollSettings,
  BankrollSummary,
  ResultChangeHistory,
} from "@/types";

// Мок пользователь (используем UUID тестового пользователя из Supabase)
export const mockUser: User = {
  id: "00000000-0000-0000-0000-000000000001",
  username: "pokerking",
  email: "player@example.com",
  avatarUrl: null,
  telegramId: 49767276,
  preferences: {
    theme: "dark",
    language: "ru",
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

// Мок результаты турниров
export const mockTournamentResults: TournamentResult[] = [
  {
    id: "result-1",
    tournamentId: "tournament-1",
    position: 3,
    payout: 850,
    profit: 700,
    roi: 70,
    notes: "Хорошая игра в финальном столе",
    knockouts: 2,
    rebuyCount: 0,
    addonCount: 1,
    finalTableReached: true,
    createdAt: "2024-01-15T20:00:00Z",
  },
  {
    id: "result-2",
    tournamentId: "tournament-2",
    position: 15,
    payout: 0,
    profit: -300,
    roi: -100,
    notes: "Неудачный блеф на префлопе",
    knockouts: 0,
    rebuyCount: 1,
    addonCount: 0,
    finalTableReached: false,
    createdAt: "2024-01-10T18:30:00Z",
  },
  {
    id: "result-3",
    tournamentId: "tournament-3",
    position: 1,
    payout: 2500,
    profit: 1500,
    roi: 150,
    notes: "Победа! Отличная игра",
    knockouts: 5,
    rebuyCount: 0,
    addonCount: 0,
    finalTableReached: true,
    createdAt: "2024-01-05T22:00:00Z",
  },
  {
    id: "result-4",
    tournamentId: "tournament-4",
    position: 8,
    payout: 200,
    profit: -300,
    roi: -60,
    notes: "ITM, но мог играть лучше",
    knockouts: 1,
    rebuyCount: 0,
    addonCount: 1,
    finalTableReached: false,
    createdAt: "2024-01-01T19:45:00Z",
  },
];

// Ключ для localStorage
const TOURNAMENTS_STORAGE_KEY = "poker-tracker-tournaments";

// Инициализация мок данных турниров
const initialTournaments: Tournament[] = [
  {
    id: "tournament-1",
    userId: "user-1",
    name: "Sunday Million",
    date: "2024-01-15T18:00:00Z",
    venue: "PokerStars Casino",
    buyin: 500,
    tournamentType: "freezeout",
    structure: "NL Hold'em",
    participants: 250,
    prizePool: 125000,
    blindLevels: "15 минут",
    startingStack: 30000,
    ticketImageUrl: null,
    notes: "Крупный воскресный турнир",
    createdAt: "2024-01-15T17:00:00Z",
    updatedAt: "2024-01-15T20:00:00Z",
    result: mockTournamentResults[0],
  },
  {
    id: "tournament-2",
    userId: "user-1",
    name: "Daily Deep Stack",
    date: "2024-01-10T17:00:00Z",
    venue: "Aria Casino",
    buyin: 300,
    tournamentType: "rebuy",
    structure: "NL Hold'em",
    participants: 180,
    prizePool: 54000,
    blindLevels: "20 минут",
    startingStack: 50000,
    ticketImageUrl: null,
    notes: "Глубокий стек, много времени на игру",
    createdAt: "2024-01-10T16:00:00Z",
    updatedAt: "2024-01-10T18:30:00Z",
    result: mockTournamentResults[1],
  },
  {
    id: "tournament-3",
    userId: "user-1",
    name: "Friday Night Special",
    date: "2024-01-05T19:00:00Z",
    venue: "Bellagio",
    buyin: 1000,
    tournamentType: "freezeout",
    structure: "NL Hold'em",
    participants: 120,
    prizePool: 120000,
    blindLevels: "30 минут",
    startingStack: 25000,
    ticketImageUrl: null,
    notes: "Престижный пятничный турнир",
    createdAt: "2024-01-05T18:00:00Z",
    updatedAt: "2024-01-05T22:00:00Z",
    result: mockTournamentResults[2],
  },
  {
    id: "tournament-4",
    userId: "user-1",
    name: "New Year Bounty",
    date: "2024-01-01T18:00:00Z",
    venue: "Wynn Casino",
    buyin: 500,
    tournamentType: "bounty",
    structure: "NL Hold'em",
    participants: 200,
    prizePool: 100000,
    blindLevels: "20 минут",
    startingStack: 40000,
    ticketImageUrl: null,
    notes: "Новогодний турнир с баунти",
    createdAt: "2024-01-01T17:00:00Z",
    updatedAt: "2024-01-01T19:45:00Z",
    result: mockTournamentResults[3],
  },
  {
    id: "tournament-5",
    userId: "user-1",
    name: "Upcoming Tournament",
    date: "2024-02-15T18:00:00Z",
    venue: "MGM Grand",
    buyin: 750,
    tournamentType: "freezeout",
    structure: "NL Hold'em",
    participants: null,
    prizePool: null,
    blindLevels: "25 минут",
    startingStack: 35000,
    ticketImageUrl: null,
    notes: "Предстоящий турнир",
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
  },
  {
    id: "tournament-6",
    userId: "user-1",
    name: "RUSSIA SOCHI 2025",
    date: "2025-08-21T18:00:00Z",
    venue: "SOCHI 2025 EVE",
    buyin: 275,
    tournamentType: "freezeout",
    structure: "NL Hold'em",
    participants: null,
    prizePool: null,
    blindLevels: null,
    startingStack: 25000,
    ticketImageUrl: null,
    notes: "Создано через распознавание билета в Telegram боте",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: {
      id: "result-6",
      tournamentId: "tournament-6",
      position: 3,
      payout: 850,
      profit: 575,
      roi: 109.09,
      notes: "Отличная игра в финальном столе! Добавлено через /result",
      knockouts: 2,
      rebuyCount: 0,
      addonCount: 1,
      finalTableReached: true,
      createdAt: new Date().toISOString(),
    },
  },
];

// Функции для работы с localStorage
function loadTournamentsFromStorage(): Tournament[] {
  if (typeof window === "undefined") {
    return initialTournaments;
  }

  try {
    const stored = localStorage.getItem(TOURNAMENTS_STORAGE_KEY);
    if (stored) {
      const parsedTournaments = JSON.parse(stored);
      return Array.isArray(parsedTournaments)
        ? parsedTournaments
        : initialTournaments;
    }
  } catch (error) {
    console.error("Error loading tournaments from localStorage:", error);
  }

  return initialTournaments;
}

function saveTournamentsToStorage(tournaments: Tournament[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(tournaments));
  } catch (error) {
    console.error("Error saving tournaments to localStorage:", error);
  }
}

// Инициализация турниров с загрузкой из localStorage
export let mockTournaments: Tournament[] = loadTournamentsFromStorage();

// Функция для инициализации данных (вызывается при первом запуске)
export function initializeTournamentData(): void {
  if (typeof window === "undefined") return;

  // Проверяем, есть ли данные в localStorage
  const stored = localStorage.getItem(TOURNAMENTS_STORAGE_KEY);
  if (!stored) {
    // Если данных нет, сохраняем начальные данные
    saveTournamentsToStorage(initialTournaments);
    mockTournaments = [...initialTournaments];
  } else {
    // Если данные есть, загружаем их
    mockTournaments = loadTournamentsFromStorage();
  }
}

// Мок статистика пользователя
export const mockUserStats: UserStats = {
  totalTournaments: 4,
  totalBuyin: 2300,
  totalWinnings: 3550,
  profit: 1250,
  roi: 54.35,
  itmRate: 75,
  bestPosition: 1,
  bestPayout: 2500,
  firstTournament: "2024-01-01T18:00:00Z",
  lastTournament: "2024-01-15T18:00:00Z",
};

// Утилитарные функции для работы с мок данными

export const getTournamentsByUser = (userId: string): Tournament[] => {
  // Всегда загружаем свежие данные из localStorage
  mockTournaments = loadTournamentsFromStorage();
  return mockTournaments.filter((t) => t.userId === userId);
};

export const getRecentTournaments = (
  userId: string,
  limit = 5,
): Tournament[] => {
  // Всегда загружаем свежие данные из localStorage
  mockTournaments = loadTournamentsFromStorage();
  return mockTournaments
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};

export const calculateUserStats = (userId: string): UserStats => {
  const userTournaments = getTournamentsByUser(userId);
  const finishedTournaments = userTournaments.filter((t) => t.result);

  if (finishedTournaments.length === 0) {
    return {
      totalTournaments: 0,
      totalBuyin: 0,
      totalWinnings: 0,
      profit: 0,
      roi: 0,
      itmRate: 0,
      bestPosition: null,
      bestPayout: null,
      firstTournament: null,
      lastTournament: null,
    };
  }

  const totalBuyin = finishedTournaments.reduce((sum, t) => sum + t.buyin, 0);
  const totalWinnings = finishedTournaments.reduce(
    (sum, t) => sum + (t.result?.payout || 0),
    0,
  );
  const profit = totalWinnings - totalBuyin;
  const roi = totalBuyin > 0 ? (profit / totalBuyin) * 100 : 0;
  const itmTournaments = finishedTournaments.filter(
    (t) => (t.result?.payout || 0) > 0,
  );
  const itmRate =
    finishedTournaments.length > 0
      ? (itmTournaments.length / finishedTournaments.length) * 100
      : 0;

  const positions = finishedTournaments.map((t) => t.result?.position || 999);
  const payouts = finishedTournaments.map((t) => t.result?.payout || 0);

  return {
    totalTournaments: finishedTournaments.length,
    totalBuyin,
    totalWinnings,
    profit,
    roi: Math.round(roi * 100) / 100,
    itmRate: Math.round(itmRate * 100) / 100,
    bestPosition: Math.min(...positions),
    bestPayout: Math.max(...payouts),
    firstTournament:
      finishedTournaments.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )[0]?.date || null,
    lastTournament:
      finishedTournaments.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )[0]?.date || null,
  };
};

// Мок данные для графиков
export const mockProfitChartData = [
  { date: "2024-01-01", profit: -500, cumulative: -500 },
  { date: "2024-01-05", profit: 1500, cumulative: 1000 },
  { date: "2024-01-10", profit: -300, cumulative: 700 },
  { date: "2024-01-15", profit: 350, cumulative: 1050 },
  { date: "2024-01-20", profit: -200, cumulative: 850 },
  { date: "2024-01-25", profit: 400, cumulative: 1250 },
];

export const mockROIChartData = [
  { type: "Freezeout", roi: 45.2, tournaments: 8 },
  { type: "Rebuy", roi: -12.5, tournaments: 3 },
  { type: "Bounty", roi: 78.3, tournaments: 5 },
  { type: "Satellite", roi: 23.1, tournaments: 2 },
  { type: "Deep Stack", roi: 15.7, tournaments: 6 },
];

export const mockPositionData = [
  { name: "1-3 место", value: 4, color: "#10b981" },
  { name: "4-10 место", value: 6, color: "#f59e0b" },
  { name: "11-20 место", value: 3, color: "#f97316" },
  { name: "20+ место", value: 2, color: "#ef4444" },
];

export const mockVenueStats = [
  { venue: "PokerStars Casino", tournaments: 5, profit: 850, roi: 42.5 },
  { venue: "Aria Casino", tournaments: 3, profit: -150, roi: -8.3 },
  { venue: "Bellagio", tournaments: 4, profit: 1200, roi: 75.0 },
  { venue: "Wynn Casino", tournaments: 2, profit: -200, roi: -20.0 },
  { venue: "MGM Grand", tournaments: 1, profit: 0, roi: 0 },
];

export const mockBankrollHistory = [
  { date: "2023-12-01", bankroll: 5000 },
  { date: "2024-01-01", bankroll: 4500 },
  { date: "2024-01-05", bankroll: 6000 },
  { date: "2024-01-10", bankroll: 5700 },
  { date: "2024-01-15", bankroll: 6050 },
  { date: "2024-01-20", bankroll: 5850 },
  { date: "2024-01-25", bankroll: 6250 },
];

// Функции для работы с турнирами
export function getTournamentById(id: string): Tournament | null {
  // Всегда загружаем свежие данные из localStorage
  mockTournaments = loadTournamentsFromStorage();
  return mockTournaments.find((tournament) => tournament.id === id) || null;
}

// Функция для получения всех турниров
export function getAllTournaments(): Tournament[] {
  // Всегда загружаем свежие данные из localStorage
  mockTournaments = loadTournamentsFromStorage();
  return [...mockTournaments];
}

// Функция для добавления нового турнира
export function addTournament(
  tournamentData: Partial<Tournament>,
  userId: string = "user-1",
): Tournament {
  const newTournament: Tournament = {
    id: `tournament-${Date.now()}`,
    userId: userId,
    name: tournamentData.name || "",
    date: tournamentData.date || new Date().toISOString(),
    venue: tournamentData.venue || "",
    buyin: tournamentData.buyin || 0,
    tournamentType: tournamentData.tournamentType || "freezeout",
    structure: tournamentData.structure || "",
    participants: tournamentData.participants || null,
    prizePool: tournamentData.prizePool || null,
    blindLevels: tournamentData.blindLevels || null,
    startingStack: tournamentData.startingStack || null,
    notes: tournamentData.notes || null,
    ticketImageUrl: null,
    result: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Перезагружаем актуальные данные из localStorage
  mockTournaments = loadTournamentsFromStorage();

  // Добавляем турнир в начало массива (последние сверху)
  mockTournaments.unshift(newTournament);

  // Сохраняем в localStorage
  saveTournamentsToStorage(mockTournaments);

  // Уведомляем об изменении данных через localStorage event
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("tournamentAdded", {
        detail: { tournament: newTournament },
      }),
    );
  }

  return newTournament;
}

// Функция для обновления турнира
export function updateTournament(
  id: string,
  updates: Partial<Tournament>,
): Tournament | null {
  const index = mockTournaments.findIndex((t) => t.id === id);
  if (index === -1) return null;

  mockTournaments[index] = {
    ...mockTournaments[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Сохраняем в localStorage
  saveTournamentsToStorage(mockTournaments);

  return mockTournaments[index];
}

// Функция для удаления турнира
export function deleteTournament(id: string): boolean {
  const index = mockTournaments.findIndex((t) => t.id === id);
  if (index === -1) return false;

  mockTournaments.splice(index, 1);

  // Сохраняем в localStorage
  saveTournamentsToStorage(mockTournaments);

  return true;
}

// Функция для добавления результата турнира
export function addTournamentResult(
  tournamentId: string,
  resultData: Partial<Tournament["result"]>,
): Tournament | null {
  const tournament = getTournamentById(tournamentId);
  if (!tournament) return null;

  const updatedResult = {
    position: resultData.position || 0,
    payout: resultData.payout || 0,
    roi: 0, // будет рассчитан автоматически
    profit: 0, // будет рассчитан автоматически
    notes: resultData.notes || "",
    knockouts: resultData.knockouts,
    rebuyCount: resultData.rebuyCount,
    addonCount: resultData.addonCount,
    timeEliminated: resultData.timeEliminated,
    finalTableReached: resultData.finalTableReached || false,
  };

  // Рассчитываем ROI и прибыль
  const totalCost =
    tournament.buyin +
    (resultData.rebuyCount || 0) * tournament.buyin +
    (resultData.addonCount || 0) * tournament.buyin;
  updatedResult.profit = updatedResult.payout - totalCost;
  updatedResult.roi =
    totalCost > 0 ? (updatedResult.profit / totalCost) * 100 : 0;

  // Добавляем запись в историю изменений
  const changedFields = Object.keys(updatedResult).filter(
    (field) =>
      updatedResult[field as keyof typeof updatedResult] !== undefined &&
      updatedResult[field as keyof typeof updatedResult] !== null &&
      updatedResult[field as keyof typeof updatedResult] !== "",
  );

  addResultHistoryEntry({
    tournamentId,
    userId: tournament.userId,
    changeType: "created",
    newData: updatedResult,
    changedFields,
    reason: "Добавление результата турнира",
  });

  const updatedTournament = updateTournament(tournamentId, {
    result: updatedResult,
    status: "finished",
  });

  return updatedTournament;
}

// Функция для обновления результата турнира
export function updateTournamentResult(
  tournamentId: string,
  resultData: Partial<Tournament["result"]>,
): Tournament | null {
  const tournament = getTournamentById(tournamentId);
  if (!tournament || !tournament.result) return null;

  const updatedResult = {
    ...tournament.result,
    position: resultData.position || tournament.result.position,
    payout:
      resultData.payout !== undefined
        ? resultData.payout
        : tournament.result.payout,
    notes:
      resultData.notes !== undefined
        ? resultData.notes
        : tournament.result.notes,
    knockouts:
      resultData.knockouts !== undefined
        ? resultData.knockouts
        : tournament.result.knockouts,
    rebuyCount:
      resultData.rebuyCount !== undefined
        ? resultData.rebuyCount
        : tournament.result.rebuyCount,
    addonCount:
      resultData.addonCount !== undefined
        ? resultData.addonCount
        : tournament.result.addonCount,
    timeEliminated:
      resultData.timeEliminated !== undefined
        ? resultData.timeEliminated
        : tournament.result.timeEliminated,
    finalTableReached:
      resultData.finalTableReached !== undefined
        ? resultData.finalTableReached
        : tournament.result.finalTableReached,
  };

  // Пересчитываем ROI и прибыль
  const totalCost =
    tournament.buyin +
    (updatedResult.rebuyCount || 0) * tournament.buyin +
    (updatedResult.addonCount || 0) * tournament.buyin;
  updatedResult.profit = updatedResult.payout - totalCost;
  updatedResult.roi =
    totalCost > 0 ? (updatedResult.profit / totalCost) * 100 : 0;

  // Добавляем запись в историю изменений
  const changedFields = Object.keys(resultData).filter(
    (field) =>
      resultData[field as keyof typeof resultData] !==
      tournament.result?.[field as keyof Tournament["result"]],
  );

  if (changedFields.length > 0) {
    addResultHistoryEntry({
      tournamentId,
      userId: tournament.userId,
      changeType: "updated",
      oldData: tournament.result,
      newData: updatedResult,
      changedFields,
      reason: "Обновление результата турнира",
    });
  }

  const updatedTournament = updateTournament(tournamentId, {
    result: updatedResult,
  });

  return updatedTournament;
}

// Мок данные для банкролла
export const mockBankrollTransactions: BankrollTransaction[] = [
  {
    id: "tx-1",
    userId: "user-1",
    type: "deposit",
    amount: 5000,
    description: "Первоначальный депозит",
    date: "2024-01-01T00:00:00Z",
    category: "poker",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "tx-2",
    userId: "user-1",
    type: "tournament_buyin",
    amount: -500,
    description: "Sunday Million - бай-ин",
    date: "2024-01-15T18:00:00Z",
    tournamentId: "tournament-1",
    category: "poker",
    createdAt: "2024-01-15T18:00:00Z",
  },
  {
    id: "tx-3",
    userId: "user-1",
    type: "tournament_payout",
    amount: 2500,
    description: "Sunday Million - выигрыш (1 место)",
    date: "2024-01-15T23:00:00Z",
    tournamentId: "tournament-1",
    category: "poker",
    createdAt: "2024-01-15T23:00:00Z",
  },
  {
    id: "tx-4",
    userId: "user-1",
    type: "tournament_buyin",
    amount: -300,
    description: "WSOP Circuit - бай-ин",
    date: "2024-01-18T16:00:00Z",
    tournamentId: "tournament-2",
    category: "poker",
    createdAt: "2024-01-18T16:00:00Z",
  },
  {
    id: "tx-5",
    userId: "user-1",
    type: "deposit",
    amount: 1000,
    description: "Дополнительный депозит",
    date: "2024-01-20T12:00:00Z",
    category: "poker",
    createdAt: "2024-01-20T12:00:00Z",
  },
  {
    id: "tx-6",
    userId: "user-1",
    type: "withdrawal",
    amount: -2000,
    description: "Вывод прибыли",
    date: "2024-01-25T10:00:00Z",
    category: "poker",
    createdAt: "2024-01-25T10:00:00Z",
  },
  {
    id: "tx-7",
    userId: "user-1",
    type: "tournament_buyin",
    amount: -250,
    description: "Bounty Builder - бай-ин",
    date: "2024-01-28T19:00:00Z",
    tournamentId: "tournament-3",
    category: "poker",
    createdAt: "2024-01-28T19:00:00Z",
  },
  {
    id: "tx-8",
    userId: "user-1",
    type: "tournament_payout",
    amount: 850,
    description: "Bounty Builder - выигрыш (3 место)",
    date: "2024-01-28T22:30:00Z",
    tournamentId: "tournament-3",
    category: "poker",
    createdAt: "2024-01-28T22:30:00Z",
  },
];

export const mockBankrollSettings: BankrollSettings = {
  userId: "user-1",
  initialBankroll: 5000,
  riskManagement: {
    maxBuyinPercentage: 5, // Максимум 5% банкролла на турнир
    stopLossPercentage: 50, // Стоп при потере 50% банкролла
    conservativeMode: false,
  },
  alerts: {
    lowBankrollWarning: true,
    highRiskTournament: true,
    profitMilestones: true,
  },
  goals: {
    targetBankroll: 10000,
    monthlyProfitTarget: 1000,
  },
};

// Функции для работы с банкроллом
export function getBankrollTransactions(userId: string): BankrollTransaction[] {
  return mockBankrollTransactions
    .filter((tx) => tx.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addBankrollTransaction(
  transactionData: Omit<BankrollTransaction, "id" | "createdAt">,
): BankrollTransaction {
  const newTransaction: BankrollTransaction = {
    ...transactionData,
    id: `tx-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  mockBankrollTransactions.unshift(newTransaction);
  return newTransaction;
}

export function getBankrollSummary(userId: string): BankrollSummary {
  const transactions = getBankrollTransactions(userId);
  const settings = mockBankrollSettings;

  let currentBankroll = settings.initialBankroll;
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let tournamentInvestments = 0;
  let tournamentWinnings = 0;
  let biggestWin = 0;
  let biggestLoss = 0;

  transactions.reverse().forEach((tx) => {
    currentBankroll += tx.amount;

    switch (tx.type) {
      case "deposit":
        totalDeposits += tx.amount;
        break;
      case "withdrawal":
        totalWithdrawals += Math.abs(tx.amount);
        break;
      case "tournament_buyin":
        tournamentInvestments += Math.abs(tx.amount);
        if (Math.abs(tx.amount) > biggestLoss) {
          biggestLoss = Math.abs(tx.amount);
        }
        break;
      case "tournament_payout":
        tournamentWinnings += tx.amount;
        if (tx.amount > biggestWin) {
          biggestWin = tx.amount;
        }
        break;
    }
  });

  const netProfit = currentBankroll - settings.initialBankroll;
  const roi =
    settings.initialBankroll > 0
      ? (netProfit / settings.initialBankroll) * 100
      : 0;

  return {
    currentBankroll,
    totalDeposits,
    totalWithdrawals,
    tournamentInvestments,
    tournamentWinnings,
    netProfit,
    roi,
    biggestWin,
    biggestLoss,
    lastUpdated: new Date().toISOString(),
  };
}

// История изменений результатов
export const mockResultHistory: ResultChangeHistory[] = [
  {
    id: "history-1",
    tournamentId: "tournament-1",
    userId: "user-1",
    changeType: "created",
    newData: {
      position: 3,
      payout: 500,
      profit: 350,
      roi: 233.33,
    },
    changedFields: ["position", "payout", "profit", "roi"],
    reason: "Добавление результата турнира",
    timestamp: "2024-01-15T20:30:00Z",
  },
  {
    id: "history-2",
    tournamentId: "tournament-2",
    userId: "user-1",
    changeType: "created",
    newData: {
      position: 1,
      payout: 2500,
      profit: 2400,
      roi: 2400,
    },
    changedFields: ["position", "payout", "profit", "roi"],
    reason: "Добавление результата турнира",
    timestamp: "2024-01-10T22:45:00Z",
  },
  {
    id: "history-3",
    tournamentId: "tournament-1",
    userId: "user-1",
    changeType: "updated",
    oldData: {
      position: 3,
      payout: 500,
      notes: "",
    },
    newData: {
      position: 3,
      payout: 500,
      notes: "Хорошая игра на финальном столе",
    },
    changedFields: ["notes"],
    reason: "Добавление комментария",
    timestamp: "2024-01-16T09:15:00Z",
  },
];

export function getResultHistory(
  userId: string,
  tournamentId?: string,
): ResultChangeHistory[] {
  let history = mockResultHistory.filter((h) => h.userId === userId);

  if (tournamentId) {
    history = history.filter((h) => h.tournamentId === tournamentId);
  }

  return history.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function addResultHistoryEntry(
  entry: Omit<ResultChangeHistory, "id" | "timestamp">,
): void {
  const newEntry: ResultChangeHistory = {
    ...entry,
    id: `history-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  mockResultHistory.push(newEntry);
}
