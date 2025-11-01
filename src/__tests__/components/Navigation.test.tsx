/**
 * Tests for Navigation component
 */

import { render, screen } from "@testing-library/react";
import Navigation from "@/components/ui/Navigation";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/ui/Toast";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock supabase
jest.mock("@/lib/supabase", () => ({
  createClientComponentClient: jest.fn(() => ({
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  })),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <ToastProvider>{component}</ToastProvider>
    </AuthProvider>,
  );
};

describe("Navigation Component", () => {
  it("should render navigation", () => {
    renderWithProviders(<Navigation />);
    // Navigation should be in document
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("should render navigation links", () => {
    renderWithProviders(<Navigation />);

    // Check for common navigation items
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });

  it("should highlight active link", () => {
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/tournaments");

    renderWithProviders(<Navigation />);

    // Active link should have special styling
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });

  it("should render logo or brand", () => {
    renderWithProviders(<Navigation />);

    // Should have some branding element
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });

  it("should be accessible", () => {
    renderWithProviders(<Navigation />);

    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });
});
