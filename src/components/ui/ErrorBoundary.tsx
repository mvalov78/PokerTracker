"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import Button from "./Button";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send error to logging service
    if (process.env.NODE_ENV === "production") {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Here you would typically send the error to a logging service
    // like Sentry, LogRocket, or similar
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Example: send to logging service
      // logService.captureException(error, { extra: errorReport })

      console.error("Error logged:", errorReport);
    } catch (loggingError) {
      console.error("Failed to log error:", loggingError);
    }
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">😵</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Что-то пошло не так
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Произошла неожиданная ошибка. Мы уже работаем над её
                исправлением.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Детали ошибки (только в разработке)
                  </summary>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 text-xs font-mono text-red-800 dark:text-red-200 overflow-auto max-h-40">
                    <div className="font-bold mb-1">Error:</div>
                    <div className="mb-2">{this.state.error.message}</div>
                    {this.state.error.stack && (
                      <>
                        <div className="font-bold mb-1">Stack:</div>
                        <pre className="whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="primary"
                  className="flex-1"
                >
                  Попробовать снова
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  Перезагрузить страницу
                </Button>
              </div>

              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Если проблема повторяется, обратитесь в поддержку
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  // Throw error to be caught by ErrorBoundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
};

// Async error boundary for handling promise rejections
export const AsyncErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  const { handleError } = useErrorHandler();

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(new Error(event.reason));
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [handleError]);

  return <ErrorBoundary {...props} />;
};

// Specific error components
export const NetworkErrorFallback = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="text-center p-6">
    <div className="text-4xl mb-4">🌐</div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Проблема с сетью
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      Не удается подключиться к серверу. Проверьте подключение к интернету.
    </p>
    {onRetry && (
      <Button onClick={onRetry} variant="primary">
        Повторить попытку
      </Button>
    )}
  </div>
);

export const NotFoundErrorFallback = ({
  onGoHome,
}: {
  onGoHome?: () => void;
}) => (
  <div className="text-center p-6">
    <div className="text-4xl mb-4">🔍</div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Страница не найдена
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      Запрашиваемая страница не существует или была перемещена.
    </p>
    {onGoHome && (
      <Button onClick={onGoHome} variant="primary">
        На главную
      </Button>
    )}
  </div>
);

export const LoadingErrorFallback = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="text-center p-6">
    <div className="text-4xl mb-4">⚠️</div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Ошибка загрузки
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      Не удалось загрузить данные. Попробуйте еще раз.
    </p>
    {onRetry && (
      <Button onClick={onRetry} variant="primary">
        Повторить
      </Button>
    )}
  </div>
);

// Error boundary with retry logic
interface RetryErrorBoundaryProps extends ErrorBoundaryProps {
  maxRetries?: number;
  retryDelay?: number;
}

export const RetryErrorBoundary: React.FC<RetryErrorBoundaryProps> = ({
  children,
  maxRetries = 3,
  retryDelay = 1000,
  ...props
}) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = React.useCallback(() => {
    if (retryCount < maxRetries) {
      setIsRetrying(true);
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setIsRetrying(false);
      }, retryDelay);
    }
  }, [retryCount, maxRetries, retryDelay]);

  const retryFallback = (
    <div className="text-center p-6">
      <div className="text-4xl mb-4">🔄</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Ошибка приложения
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {retryCount < maxRetries
          ? "Произошла ошибка. Попробуем еще раз?"
          : "Превышено максимальное количество попыток."}
      </p>
      {retryCount < maxRetries && (
        <Button onClick={handleRetry} variant="primary" loading={isRetrying}>
          {isRetrying ? "Повторяем..." : "Повторить попытку"}
        </Button>
      )}
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Попытка {retryCount + 1} из {maxRetries + 1}
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      {...props}
      key={retryCount} // Reset boundary on retry
      fallback={retryFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
