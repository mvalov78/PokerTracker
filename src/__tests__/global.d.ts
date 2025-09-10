// Типы для глобальных переменных в тестах
declare global {
  var mockSupabase: any
  var setMockData: (data: any) => void
  var setMockError: (error: any) => void
  var resetMocks: () => void
  var fetch: jest.Mock
  
  namespace NodeJS {
    interface Global {
      mockSupabase: any
      setMockData: (data: any) => void
      setMockError: (error: any) => void
      resetMocks: () => void
      fetch: jest.Mock
    }
  }
}

export {}
