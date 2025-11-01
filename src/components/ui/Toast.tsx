"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Типы для Toast
export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "CLEAR_TOASTS" };

// Reducer для управления состоянием Toast
function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.id),
      };
    case "CLEAR_TOASTS":
      return {
        ...state,
        toasts: [],
      };
    default:
      return state;
  }
}

// Context для Toast
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Provider компонент
interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    };

    dispatch({ type: "ADD_TOAST", toast: newToast });

    // Автоматическое удаление через указанное время
    if (newToast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", id });
      }, newToast.duration);
    }
  };

  const removeToast = (id: string) => {
    dispatch({ type: "REMOVE_TOAST", id });
  };

  const clearToasts = () => {
    dispatch({ type: "CLEAR_TOASTS" });
  };

  return (
    <ToastContext.Provider
      value={{
        toasts: state.toasts,
        addToast,
        removeToast,
        clearToasts,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook для использования Toast
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Компонент отдельного Toast
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const typeStyles = {
    success:
      "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
    error:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    warning:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  };

  const typeIcons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  return (
    <div
      className={cn(
        "max-w-sm w-full shadow-lg rounded-lg border p-4 mb-4 animate-slide-down",
        typeStyles[toast.type],
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg">{typeIcons[toast.type]}</span>
        </div>
        <div className="ml-3 w-0 flex-1">
          {toast.title && (
            <p className="text-sm font-semibold">{toast.title}</p>
          )}
          <p className="text-sm">{toast.message}</p>
          {toast.action && (
            <div className="mt-2">
              <button
                onClick={toast.action.onClick}
                className="text-sm font-medium underline hover:no-underline"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => onRemove(toast.id)}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="sr-only">Закрыть</span>
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Контейнер для Toast
function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

// Утилиты для быстрого создания Toast
export const toast = {
  success: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>,
  ) => {
    const context = useContext(ToastContext);
    if (context) {
      context.addToast({ ...options, message, type: "success" });
    }
  },

  error: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>,
  ) => {
    const context = useContext(ToastContext);
    if (context) {
      context.addToast({ ...options, message, type: "error" });
    }
  },

  warning: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>,
  ) => {
    const context = useContext(ToastContext);
    if (context) {
      context.addToast({ ...options, message, type: "warning" });
    }
  },

  info: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>,
  ) => {
    const context = useContext(ToastContext);
    if (context) {
      context.addToast({ ...options, message, type: "info" });
    }
  },
};
