import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Navigation from "@/components/ui/Navigation";

const signOut = jest.fn().mockResolvedValue(undefined);
const addToast = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { email: "player@example.com" },
    profile: { username: "player" },
    signOut,
  }),
}));

jest.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ addToast }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: jest.fn() }),
}));

describe("Navigation logout", () => {
  beforeEach(() => {
    signOut.mockClear();
    addToast.mockClear();
  });

  it("signs out when Выйти is clicked", async () => {
    render(<Navigation />);

    fireEvent.click(screen.getByRole("button", { name: /player/i }));
    fireEvent.click(screen.getAllByRole("button", { name: "🚪 Выйти" })[0]);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success" }),
    );
  });
});
