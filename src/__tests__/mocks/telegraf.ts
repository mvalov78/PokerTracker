/**
 * Comprehensive Telegraf mocks for testing bot functionality
 */

export interface MockTelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  is_bot?: boolean;
}

export interface MockTelegramMessage {
  message_id: number;
  from?: MockTelegramUser;
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    file_size: number;
    width: number;
    height: number;
  }>;
  document?: {
    file_id: string;
    file_unique_id: string;
    file_size: number;
    file_name: string;
    mime_type: string;
  };
}

export interface MockBotContext {
  message?: MockTelegramMessage;
  from?: MockTelegramUser;
  session: {
    ocrData?: any;
    currentAction?: string;
    tournamentData?: any;
    [key: string]: any;
  };
  telegram: {
    getFileLink: jest.Mock;
    getFile: jest.Mock;
    sendMessage: jest.Mock;
  };
  reply: jest.Mock;
  answerCbQuery: jest.Mock;
  editMessageText: jest.Mock;
}

export function createMockTelegramUser(
  overrides?: Partial<MockTelegramUser>,
): MockTelegramUser {
  return {
    id: 123456789,
    first_name: "Test",
    last_name: "User",
    username: "testuser",
    is_bot: false,
    ...overrides,
  };
}

export function createMockMessage(
  overrides?: Partial<MockTelegramMessage>,
): MockTelegramMessage {
  return {
    message_id: 1,
    from: createMockTelegramUser(),
    chat: {
      id: 123456789,
      type: "private",
    },
    date: Date.now(),
    text: "/start",
    ...overrides,
  };
}

export function createMockBotContext(
  overrides?: Partial<MockBotContext>,
): MockBotContext {
  const mockContext: MockBotContext = {
    message: createMockMessage(),
    from: createMockTelegramUser(),
    session: {},
    telegram: {
      getFileLink: jest.fn().mockResolvedValue({
        href: "https://api.telegram.org/file/bot123/photo.jpg",
      }),
      getFile: jest.fn().mockResolvedValue({
        file_id: "file123",
        file_unique_id: "unique123",
        file_size: 50000,
        file_path: "photos/file123.jpg",
      }),
      sendMessage: jest.fn().mockResolvedValue({ message_id: 2 }),
    },
    reply: jest.fn().mockResolvedValue({ message_id: 2 }),
    answerCbQuery: jest.fn().mockResolvedValue(true),
    editMessageText: jest.fn().mockResolvedValue({ message_id: 1 }),
    ...overrides,
  };

  return mockContext;
}

export function createPhotoMessage(photoCount = 3): MockTelegramMessage {
  const photos = [];
  for (let i = 0; i < photoCount; i++) {
    photos.push({
      file_id: `photo_${i}`,
      file_unique_id: `unique_${i}`,
      file_size: 50000 * (i + 1),
      width: 640 * (i + 1),
      height: 480 * (i + 1),
    });
  }

  return createMockMessage({
    photo: photos,
    text: undefined,
  });
}

export function createDocumentMessage(
  mimeType = "image/jpeg",
): MockTelegramMessage {
  return createMockMessage({
    document: {
      file_id: "doc123",
      file_unique_id: "unique_doc",
      file_size: 100000,
      file_name: "ticket.jpg",
      mime_type: mimeType,
    },
    text: undefined,
  });
}

export function createCallbackQueryContext(
  data: string,
): Partial<MockBotContext> {
  return {
    ...createMockBotContext(),
    message: undefined,
    from: createMockTelegramUser(),
  };
}

export function resetMockContext(ctx: MockBotContext) {
  ctx.reply.mockClear();
  ctx.answerCbQuery.mockClear();
  ctx.editMessageText.mockClear();
  ctx.telegram.getFileLink.mockClear();
  ctx.telegram.getFile.mockClear();
  ctx.telegram.sendMessage.mockClear();
  ctx.session = {};
}
