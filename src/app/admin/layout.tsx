"use client";

import type { ReactNode } from "react";
import { ProtectedRoute } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  { href: "/admin", label: "Обзор", exact: true },
  { href: "/admin/bot-management", label: "🤖 Управление ботом" },
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/tournaments", label: "Турниры" },
  { href: "/admin/analytics", label: "Аналитика" },
  { href: "/admin/settings", label: "Настройки" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Панель администратора
                </h1>
                <p className="text-gray-400">
                  Управление системой PokerTracker
                </p>
              </div>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Вернуться в приложение
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-8">
            <nav className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
              {adminNavItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      px-4 py-2 rounded-md text-sm font-medium transition-colors
                      ${
                        isActive
                          ? "bg-emerald-600 text-white"
                          : "text-gray-300 hover:text-white hover:bg-gray-700"
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
