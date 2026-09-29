import {
  createAdminClient,
  createProfile,
  getProfile,
  getProfileByTelegramId,
  updateProfile,
} from "@/lib/supabase";

const TELEGRAM_EMAIL_DOMAIN = "users.pokertracker.local";

export function telegramProfileEmail(telegramId: number): string {
  return `telegram+${telegramId}@${TELEGRAM_EMAIL_DOMAIN}`;
}

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

async function findAuthUserIdByEmail(
  admin: AdminClient,
  email: string,
): Promise<string | null> {
  const perPage = 200;

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const match = data.users.find((user) => user.email === email);
    if (match) {
      return match.id;
    }

    if (data.users.length < perPage) {
      return null;
    }
  }

  return null;
}

/**
 * Возвращает профиль Telegram-пользователя.
 * Существующий профиль не изменяется, поэтому уже сохранённые турниры остаются у него.
 * Новый Telegram-аккаунт получает отдельного auth-пользователя и не прикрепляется к чужому профилю.
 */
export async function getOrCreateTelegramProfile(
  telegramId: number,
  username?: string,
) {
  const existing = await getProfileByTelegramId(telegramId);
  if (existing) {
    return existing;
  }

  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client not configured");
  }

  const email = telegramProfileEmail(telegramId);
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      username: username || `tg_${telegramId}`,
      telegram_id: telegramId,
    },
  });

  let authUserId = created?.user?.id ?? null;
  if (!authUserId) {
    authUserId = await findAuthUserIdByEmail(admin, email);
  }

  if (!authUserId) {
    throw new Error(
      createError?.message ||
        "Failed to create a dedicated user for this Telegram account",
    );
  }

  const profile = await getProfile(authUserId);
  if (profile) {
    if (
      profile.telegram_id != null &&
      Number(profile.telegram_id) !== telegramId
    ) {
      throw new Error("Refusing to attach Telegram account to another user");
    }

    if (profile.telegram_id == null) {
      return updateProfile(authUserId, {
        telegram_id: telegramId,
        username: profile.username || username || `tg_${telegramId}`,
      });
    }

    return profile;
  }

  return createProfile(authUserId, {
    id: authUserId,
    telegram_id: telegramId,
    username: username || `tg_${telegramId}`,
    role: "player",
  });
}
