import { render, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const getUser = jest.fn();
let insideAuthCallback = false;
let getUserCalledInsideCallback = false;

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock("@/lib/supabase", () => ({
  createClientComponentClient: jest.fn(() => ({
    auth: {
      getUser: (...args: unknown[]) => getUser(...args),
      onAuthStateChange: (callback: (event: string) => void) => {
        insideAuthCallback = true;
        const result = callback("SIGNED_IN");
        insideAuthCallback = false;
        expect(result).toBeUndefined();
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      },
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: "u1",
              username: "qa-portal-a",
              role: "player",
            },
            error: null,
          }),
        })),
      })),
    })),
  })),
}));

function Probe() {
  const { profile } = useAuth();
  return <div>{profile?.username || "none"}</div>;
}

describe("AuthProvider session listener", () => {
  beforeEach(() => {
    insideAuthCallback = false;
    getUserCalledInsideCallback = false;
    getUser.mockImplementation(async () => {
      if (insideAuthCallback) {
        getUserCalledInsideCallback = true;
      }
      return {
        data: {
          user: {
            id: "u1",
            email: "qa.portal.a@pokertracker.test",
          },
        },
        error: null,
      };
    });
  });

  it("does not call getUser while the auth callback is still running", async () => {
    const view = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(getUserCalledInsideCallback).toBe(false);

    await waitFor(() => {
      expect(view.getByText("qa-portal-a")).toBeInTheDocument();
    });
    expect(getUser).toHaveBeenCalled();
    expect(getUserCalledInsideCallback).toBe(false);
  });
});
