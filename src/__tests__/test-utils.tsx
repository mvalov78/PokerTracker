/**
 * Test utilities and wrappers for component testing
 */

import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/Toast";

// Mock AuthProvider для тестов
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Универсальный wrapper со всеми необходимыми провайдерами
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <MockAuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </MockAuthProvider>
  );
}

// Кастомный render с провайдерами
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
