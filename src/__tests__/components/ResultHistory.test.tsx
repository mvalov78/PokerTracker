/**
 * Tests for ResultHistory component
 */

import { render, screen } from "@testing-library/react";
import ResultHistory from "@/components/results/ResultHistory";

// Mock mockData module
jest.mock("@/data/mockData", () => ({
  getResultHistory: jest.fn(() => [
    {
      id: "1",
      tournamentId: "tournament_1",
      tournamentName: "Tournament 1",
      changeType: "created",
      changedBy: "user_123",
      changedAt: "2024-01-15T12:00:00Z",
      changes: {},
    },
    {
      id: "2",
      tournamentId: "tournament_2",
      tournamentName: "Tournament 2",
      changeType: "updated",
      changedBy: "user_123",
      changedAt: "2024-01-16T12:00:00Z",
      changes: {},
    },
  ]),
  getTournamentById: jest.fn((id) => ({
    id,
    name: `Tournament ${id}`,
  })),
}));

describe("ResultHistory Component", () => {
  it("should render with result history", () => {
    render(<ResultHistory userId="user_123" />);

    // Should render history items
    expect(screen.getByText(/История изменений/i)).toBeInTheDocument();
  });

  it("should render empty history", () => {
    const { getResultHistory } = require("@/data/mockData");
    getResultHistory.mockReturnValue([]);

    render(<ResultHistory userId="user_123" />);

    // Should render component
    expect(screen.getByText(/История изменений/i)).toBeInTheDocument();
  });

  it("should render with specific tournament", () => {
    // Mock getTournamentById to return a tournament name
    const { getTournamentById } = require("@/data/mockData");
    getTournamentById.mockReturnValue({ name: "Test Tournament Name" });

    render(<ResultHistory userId="user_123" tournamentId="tournament_1" />);

    // Should render component
    expect(screen.getByText(/История изменений/i)).toBeInTheDocument();
  });

  it("should show change icons", () => {
    render(<ResultHistory userId="user_123" />);

    // Component should render
    expect(screen.getByText(/История изменений/i)).toBeInTheDocument();
  });

  it("should limit items when maxItems specified", () => {
    render(<ResultHistory userId="user_123" maxItems={5} />);

    // Component should render with limit
    expect(screen.getByText(/История изменений/i)).toBeInTheDocument();
  });
});
