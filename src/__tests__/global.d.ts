// Типы для глобальных переменных в тестах
declare global {
  var mockSupabase: any;
  var setMockData: (data: any) => void;
  var setMockError: (error: any) => void;
  var resetMocks: () => void;
}

export {};
