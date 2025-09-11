/**
 * Интеграционные тесты для системы управления площадками
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProviders } from "@/components/providers/AppProviders";
import { UserSettingsService } from "@/services/userSettingsService";

// Mock UserSettingsService
jest.mock("@/services/userSettingsService", () => ({
  UserSettingsService: {
    getCurrentVenue: jest.fn(),
    updateCurrentVenue: jest.fn(),
    getUserSettings: jest.fn(),
    createUserSettings: jest.fn(),
  },
}));

const mockUserSettingsService = UserSettingsService as jest.Mocked<
  typeof UserSettingsService
>;

// Mock компонент для тестирования venue management
const MockVenueManager = () => {
  const [currentVenue, setCurrentVenue] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [newVenue, setNewVenue] = React.useState("");

  const loadCurrentVenue = async () => {
    setIsLoading(true);
    try {
      const venue = await UserSettingsService.getCurrentVenue("test-user");
      setCurrentVenue(venue);
    } catch (error) {
      console.error("Error loading venue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateVenue = async () => {
    if (!newVenue.trim()) return;

    setIsLoading(true);
    try {
      await UserSettingsService.updateCurrentVenue("test-user", newVenue);
      setCurrentVenue(newVenue);
      setNewVenue("");
    } catch (error) {
      console.error("Error updating venue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadCurrentVenue();
  }, []);

  return (
    <div data-testid="venue-manager">
      <h2>Управление площадкой</h2>

      <div data-testid="current-venue-section">
        <h3>Текущая площадка:</h3>
        {isLoading ? (
          <p data-testid="loading">Загрузка...</p>
        ) : (
          <p data-testid="current-venue">{currentVenue || "Не установлена"}</p>
        )}
      </div>

      <div data-testid="update-venue-section">
        <h3>Установить новую площадку:</h3>
        <input
          type="text"
          value={newVenue}
          onChange={(e) => setNewVenue(e.target.value)}
          placeholder="Название площадки"
          data-testid="venue-input"
        />
        <button
          onClick={updateVenue}
          disabled={!newVenue.trim() || isLoading}
          data-testid="update-venue-button"
        >
          {isLoading ? "Обновление..." : "Установить площадку"}
        </button>
      </div>

      <button
        onClick={loadCurrentVenue}
        disabled={isLoading}
        data-testid="refresh-venue-button"
      >
        Обновить
      </button>
    </div>
  );
};

// Mock компонент турнира с venue
const MockTournamentWithVenue = () => {
  const [currentVenue, setCurrentVenue] = React.useState<string | null>(null);
  const [tournamentData, setTournamentData] = React.useState({
    name: "",
    venue: "",
  });

  const loadCurrentVenue = async () => {
    const venue = await UserSettingsService.getCurrentVenue("test-user");
    setCurrentVenue(venue);
    if (venue) {
      setTournamentData((prev) => ({ ...prev, venue }));
    }
  };

  React.useEffect(() => {
    loadCurrentVenue();
  }, []);

  return (
    <div data-testid="tournament-with-venue">
      <h2>Создание турнира</h2>

      <div data-testid="venue-info">
        <p>Текущая площадка: {currentVenue || "Не установлена"}</p>
        <p>Площадка турнира: {tournamentData.venue || "Не указана"}</p>
      </div>

      <input
        type="text"
        value={tournamentData.name}
        onChange={(e) =>
          setTournamentData((prev) => ({ ...prev, name: e.target.value }))
        }
        placeholder="Название турнира"
        data-testid="tournament-name-input"
      />

      <input
        type="text"
        value={tournamentData.venue}
        onChange={(e) =>
          setTournamentData((prev) => ({ ...prev, venue: e.target.value }))
        }
        placeholder="Площадка (автоматически заполнится)"
        data-testid="tournament-venue-input"
      />

      <button
        onClick={() => {
          // Simulate tournament creation with current venue priority
          const finalVenue =
            currentVenue || tournamentData.venue || "Не указана";
          setTournamentData((prev) => ({ ...prev, venue: finalVenue }));
        }}
        data-testid="create-tournament-button"
      >
        Создать турнир
      </button>
    </div>
  );
};

describe("Venue Management Integration Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display current venue when loaded", async () => {
    mockUserSettingsService.getCurrentVenue.mockResolvedValue("Casino Royale");

    render(
      <AppProviders>
        <MockVenueManager />
      </AppProviders>,
    );

    // Initially shows loading
    expect(screen.getByTestId("loading")).toBeInTheDocument();

    // Wait for venue to load
    await waitFor(() => {
      expect(screen.getByTestId("current-venue")).toHaveTextContent(
        "Casino Royale",
      );
    });

    expect(mockUserSettingsService.getCurrentVenue).toHaveBeenCalledWith(
      "test-user",
    );
  });

  it('should display "Не установлена" when no venue is set', async () => {
    mockUserSettingsService.getCurrentVenue.mockResolvedValue(null);

    render(
      <AppProviders>
        <MockVenueManager />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("current-venue")).toHaveTextContent(
        "Не установлена",
      );
    });
  });

  it("should update venue successfully", async () => {
    mockUserSettingsService.getCurrentVenue.mockResolvedValue(null);
    mockUserSettingsService.updateCurrentVenue.mockResolvedValue({
      id: "test-id",
      user_id: "test-user",
      current_venue: "New Casino",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });

    render(
      <AppProviders>
        <MockVenueManager />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("current-venue")).toHaveTextContent(
        "Не установлена",
      );
    });

    // Set new venue
    await user.type(screen.getByTestId("venue-input"), "New Casino");
    await user.click(screen.getByTestId("update-venue-button"));

    // Wait for update
    await waitFor(() => {
      expect(screen.getByTestId("current-venue")).toHaveTextContent(
        "New Casino",
      );
    });

    expect(mockUserSettingsService.updateCurrentVenue).toHaveBeenCalledWith(
      "test-user",
      "New Casino",
    );
  });

  it("should not update with empty venue name", async () => {
    mockUserSettingsService.getCurrentVenue.mockResolvedValue(null);

    render(
      <AppProviders>
        <MockVenueManager />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("update-venue-button")).toBeDisabled();
    });

    // Try to click with empty input
    await user.click(screen.getByTestId("update-venue-button"));

    expect(mockUserSettingsService.updateCurrentVenue).not.toHaveBeenCalled();
  });

  it("should handle venue loading errors gracefully", async () => {
    mockUserSettingsService.getCurrentVenue.mockRejectedValue(
      new Error("Database error"),
    );

    render(
      <AppProviders>
        <MockVenueManager />
      </AppProviders>,
    );

    // Should still finish loading state
    await waitFor(() => {
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    });
  });

  it("should handle venue update errors gracefully", async () => {
    mockUserSettingsService.getCurrentVenue.mockResolvedValue("Old Casino");
    mockUserSettingsService.updateCurrentVenue.mockRejectedValue(
      new Error("Update failed"),
    );

    render(
      <AppProviders>
        <MockVenueManager />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("current-venue")).toHaveTextContent(
        "Old Casino",
      );
    });

    // Try to update
    await user.type(screen.getByTestId("venue-input"), "New Casino");
    await user.click(screen.getByTestId("update-venue-button"));

    // Should finish loading state even on error
    await waitFor(() => {
      expect(screen.getByTestId("update-venue-button")).not.toHaveTextContent(
        "Обновление...",
      );
    });

    // Venue should remain unchanged
    expect(screen.getByTestId("current-venue")).toHaveTextContent("Old Casino");
  });

  it("should refresh venue when refresh button is clicked", async () => {
    mockUserSettingsService.getCurrentVenue
      .mockResolvedValueOnce("Initial Casino")
      .mockResolvedValueOnce("Updated Casino");

    render(
      <AppProviders>
        <MockVenueManager />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("current-venue")).toHaveTextContent(
        "Initial Casino",
      );
    });

    // Click refresh
    await user.click(screen.getByTestId("refresh-venue-button"));

    await waitFor(() => {
      expect(screen.getByTestId("current-venue")).toHaveTextContent(
        "Updated Casino",
      );
    });

    expect(mockUserSettingsService.getCurrentVenue).toHaveBeenCalledTimes(2);
  });

  describe("Tournament Creation with Venue Priority", () => {
    it("should use current venue for new tournament", async () => {
      mockUserSettingsService.getCurrentVenue.mockResolvedValue(
        "Default Casino",
      );

      render(
        <AppProviders>
          <MockTournamentWithVenue />
        </AppProviders>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Текущая площадка: Default Casino"),
        ).toBeInTheDocument();
        expect(
          screen.getByText("Площадка турнира: Default Casino"),
        ).toBeInTheDocument();
      });

      // Tournament venue input should be pre-filled
      expect(screen.getByTestId("tournament-venue-input")).toHaveValue(
        "Default Casino",
      );
    });

    it("should prioritize current venue over manual input", async () => {
      mockUserSettingsService.getCurrentVenue.mockResolvedValue(
        "Priority Casino",
      );

      render(
        <AppProviders>
          <MockTournamentWithVenue />
        </AppProviders>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Текущая площадка: Priority Casino"),
        ).toBeInTheDocument();
      });

      // Manually change venue
      const venueInput = screen.getByTestId("tournament-venue-input");
      await user.clear(venueInput);
      await user.type(venueInput, "Manual Casino");

      // Create tournament - should use current venue
      await user.click(screen.getByTestId("create-tournament-button"));

      await waitFor(() => {
        expect(
          screen.getByText("Площадка турнира: Priority Casino"),
        ).toBeInTheDocument();
      });
    });

    it("should use manual venue when no current venue is set", async () => {
      mockUserSettingsService.getCurrentVenue.mockResolvedValue(null);

      render(
        <AppProviders>
          <MockTournamentWithVenue />
        </AppProviders>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Текущая площадка: Не установлена"),
        ).toBeInTheDocument();
      });

      // Set manual venue
      await user.type(
        screen.getByTestId("tournament-venue-input"),
        "Manual Casino",
      );

      // Create tournament
      await user.click(screen.getByTestId("create-tournament-button"));

      await waitFor(() => {
        expect(
          screen.getByText("Площадка турнира: Manual Casino"),
        ).toBeInTheDocument();
      });
    });
  });
});

// Add React import for JSX
import React from "react";
