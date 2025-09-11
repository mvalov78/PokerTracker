"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

function AuthPageContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, signInWithGoogle, isLoading, isAuthenticated } =
    useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Перенаправление если пользователь уже авторизован
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  // Показать ошибку из URL (например, от OAuth callback)
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "auth_callback_error") {
      addToast({
        type: "error",
        message:
          "Произошла ошибка при авторизации через Google. Попробуйте еще раз.",
      });
    }
  }, [searchParams, addToast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Очистка ошибки при изменении поля
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email обязателен";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Неверный формат email";
    }

    if (!formData.password) {
      newErrors.password = "Пароль обязателен";
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов";
    }

    if (!isLogin && !formData.username) {
      newErrors.username = "Имя пользователя обязательно";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let result;
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(
          formData.email,
          formData.password,
          formData.username,
        );
      }

      if (result.success) {
        addToast({
          type: "success",
          message: isLogin
            ? "Добро пожаловать!"
            : "Проверьте email для подтверждения регистрации",
        });
        if (isLogin) {
          const redirect = searchParams.get("redirect") || "/";
          router.push(redirect);
        }
      } else {
        addToast({
          type: "error",
          message: result.error || "Произошла ошибка",
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        message: "Произошла непредвиденная ошибка",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        addToast({
          type: "error",
          message: result.error || "Произошла ошибка при входе через Google",
        });
      }
      // При успехе пользователя перенаправит OAuth callback
    } catch (error) {
      addToast({
        type: "error",
        message: "Произошла непредвиденная ошибка",
      });
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: "", password: "", username: "" });
    setErrors({});
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4">
            <span className="text-2xl">♠️</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            PokerTracker Pro
          </h1>
          <p className="text-gray-400">Отслеживайте свой покерный путь</p>
        </div>

        {/* Auth Form */}
        <Card className="glass-card">
          <CardHeader className="p-6">
            <div className="flex mb-6 bg-gray-800/50 rounded-lg p-1">
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  isLogin ? "bg-emerald-600 text-white" : "text-gray-400"
                }`}
                onClick={() => setIsLogin(true)}
                type="button"
              >
                Вход
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  !isLogin ? "bg-emerald-600 text-white" : "text-gray-400"
                }`}
                onClick={() => setIsLogin(false)}
                type="button"
              >
                Регистрация
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                error={errors.email}
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
              />

              {!isLogin && (
                <Input
                  type="text"
                  label="Никнейм"
                  placeholder="Ваш никнейм"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  error={errors.username}
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
                />
              )}

              <Input
                type="password"
                label="Пароль"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                error={errors.password}
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
              />

              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
                size="lg"
              >
                {isLogin ? "Войти" : "Зарегистрироваться"}
              </Button>
            </form>

            {/* Google OAuth - только если настроен */}
            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <>
                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900 text-gray-400">или</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                  size="lg"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Войти через Google
                </Button>
              </>
            )}

            {/* Local testing info */}
            <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg">
              <p className="text-sm text-emerald-200 mb-2">
                <strong>Локальное тестирование:</strong>
              </p>
              {isLogin ? (
                <div className="text-xs text-emerald-300">
                  <p className="mb-2">
                    Используйте существующий аккаунт или создайте новый.
                  </p>
                  <p className="mb-1">• Админ: mvalov78@gmail.com</p>
                  <p>• Для тестов создайте дополнительные аккаунты</p>
                </div>
              ) : (
                <div className="text-xs text-emerald-300">
                  <p className="mb-2">
                    Создайте новый аккаунт для тестирования:
                  </p>
                  <p className="mb-1">
                    • Укажите любой email (test@example.com)
                  </p>
                  <p className="mb-1">• Пароль минимум 6 символов</p>
                  <p>• Подтверждение email не требуется в dev-режиме</p>
                </div>
              )}
            </div>

            {/* Switch mode */}
            <div className="mt-6 text-center">
              <button
                onClick={switchMode}
                type="button"
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                {isLogin
                  ? "Нет аккаунта? Зарегистрируйтесь"
                  : "Уже есть аккаунт? Войдите"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
