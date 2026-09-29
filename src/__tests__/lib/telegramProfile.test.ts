/**
 * Границы:
 * - Telegram ID уже есть в profiles: профиль возвращается как есть, auth-пользователь не создаётся
 * - Telegram ID новый, в auth уже есть другие люди: создаётся отдельный пользователь, чужой id не используется
 * - createUser не удался, в списке только чужие email: ошибка, профиль чужого пользователя не забирается
 * - createUser не удался, но email этого Telegram ID уже есть: берётся только этот auth id
 * - у найденного auth-пользователя профиль с другим telegram_id: отказ, строка не перезаписывается
 */

import {
  createAdminClient,
  createProfile,
  getProfile,
  getProfileByTelegramId,
  updateProfile,
} from "@/lib/supabase";
import {
  getOrCreateTelegramProfile,
  telegramProfileEmail,
} from "@/lib/telegramProfile";

jest.mock("@/lib/supabase", () => ({
  createAdminClient: jest.fn(),
  getProfileByTelegramId: jest.fn(),
  getProfile: jest.fn(),
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

const mockGetProfileByTelegramId = getProfileByTelegramId as jest.Mock;
const mockGetProfile = getProfile as jest.Mock;
const mockCreateProfile = createProfile as jest.Mock;
const mockUpdateProfile = updateProfile as jest.Mock;
const mockCreateAdminClient = createAdminClient as jest.Mock;

function mockAdmin(createUser: jest.Mock, listUsers: jest.Mock) {
  mockCreateAdminClient.mockReturnValue({
    auth: {
      admin: {
        createUser,
        listUsers,
      },
    },
  });
}

describe("getOrCreateTelegramProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an existing telegram profile without creating a user", async () => {
    const existing = {
      id: "existing-profile",
      telegram_id: 49767276,
      username: "owner",
    };
    mockGetProfileByTelegramId.mockResolvedValue(existing);
    const createUser = jest.fn();
    mockAdmin(createUser, jest.fn());

    const profile = await getOrCreateTelegramProfile(49767276);

    expect(profile).toBe(existing);
    expect(createUser).not.toHaveBeenCalled();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(mockCreateProfile).not.toHaveBeenCalled();
  });

  it("creates a dedicated auth user instead of reusing another account", async () => {
    mockGetProfileByTelegramId.mockResolvedValue(null);
    mockGetProfile.mockResolvedValue(null);
    mockCreateProfile.mockImplementation(async (_id: string, data: object) => data);

    const createUser = jest.fn().mockResolvedValue({
      data: { user: { id: "new-auth-user" } },
      error: null,
    });
    const listUsers = jest.fn().mockResolvedValue({
      data: {
        users: [{ id: "owner-auth-user", email: "owner@example.com" }],
      },
      error: null,
    });
    mockAdmin(createUser, listUsers);

    const profile = await getOrCreateTelegramProfile(555001, "newbie");

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: telegramProfileEmail(555001),
      }),
    );
    expect(listUsers).not.toHaveBeenCalled();
    expect(mockCreateProfile).toHaveBeenCalledWith(
      "new-auth-user",
      expect.objectContaining({
        id: "new-auth-user",
        telegram_id: 555001,
        username: "newbie",
      }),
    );
    expect(profile).toEqual(
      expect.objectContaining({ id: "new-auth-user", telegram_id: 555001 }),
    );
  });

  it("does not attach a failed create to the first existing auth user", async () => {
    mockGetProfileByTelegramId.mockResolvedValue(null);
    const createUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "create failed" },
    });
    const listUsers = jest.fn().mockResolvedValue({
      data: {
        users: [{ id: "owner-auth-user", email: "owner@example.com" }],
      },
      error: null,
    });
    mockAdmin(createUser, listUsers);

    await expect(getOrCreateTelegramProfile(555002)).rejects.toThrow(
      "create failed",
    );
    expect(mockCreateProfile).not.toHaveBeenCalled();
    expect(mockGetProfile).not.toHaveBeenCalledWith("owner-auth-user");
  });

  it("reuses only the auth user whose email belongs to this telegram id", async () => {
    mockGetProfileByTelegramId.mockResolvedValue(null);
    mockGetProfile.mockResolvedValue(null);
    mockCreateProfile.mockImplementation(async (_id: string, data: object) => data);

    const createUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "already registered" },
    });
    const listUsers = jest.fn().mockResolvedValue({
      data: {
        users: [
          { id: "owner-auth-user", email: "owner@example.com" },
          { id: "telegram-auth-user", email: telegramProfileEmail(555003) },
        ],
      },
      error: null,
    });
    mockAdmin(createUser, listUsers);

    await getOrCreateTelegramProfile(555003);

    expect(mockCreateProfile).toHaveBeenCalledWith(
      "telegram-auth-user",
      expect.objectContaining({ telegram_id: 555003 }),
    );
  });

  it("refuses to overwrite a profile linked to a different telegram id", async () => {
    mockGetProfileByTelegramId.mockResolvedValue(null);
    mockGetProfile.mockResolvedValue({
      id: "taken-profile",
      telegram_id: 111,
      username: "taken",
    });

    const createUser = jest.fn().mockResolvedValue({
      data: { user: { id: "taken-profile" } },
      error: null,
    });
    mockAdmin(createUser, jest.fn());

    await expect(getOrCreateTelegramProfile(555004)).rejects.toThrow(
      "Refusing to attach Telegram account to another user",
    );
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });
});
