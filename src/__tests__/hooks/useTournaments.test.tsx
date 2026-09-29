/**
 * Tests for useTournaments hook
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useTournaments } from "@/hooks/useTournaments";
import {
  mockFetch,
  resetFetchMock,
  createMockTournament,
} from "../utils/testHelpers";

describe("useTournaments", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  afterEach(() => {
    resetFetchMock();
  });

  it("should load tournaments successfully", async () => {
    const mockTournaments = [
      createMockTournament({ id: "1", name: "Tournament 1" }),
      createMockTournament({ id: "2", name: "Tournament 2" }),
    ];

    mockFetch({ success: true, tournaments: mockTournaments });

    const { result } = renderHook(() => useTournaments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tournaments).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it("should handle error when loading fails", async () => {
    mockFetch({ success: false, error: "Failed to load" }, 500);

    const { result } = renderHook(() => useTournaments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tournaments).toHaveLength(0);
    expect(result.current.error).toBeTruthy();
  });

  it("should load tournaments for specific user", async () => {
    const mockTournaments = [createMockTournament({ userId: "user123" })];

    mockFetch({ success: true, tournaments: mockTournaments });

    const { result } = renderHook(() => useTournaments("user123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tournaments).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/tournaments?userId=user123",
      expect.any(Object),
    );
  });

  it("should refresh tournaments on demand", async () => {
    const mockTournaments = [createMockTournament()];

    mockFetch({ success: true, tournaments: mockTournaments });

    const { result } = renderHook(() => useTournaments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear the mock
    (global.fetch as jest.Mock).mockClear();

    // Refresh
    mockFetch({ success: true, tournaments: [] });
    result.current.refresh();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("should start with loading state", () => {
    mockFetch({ success: true, tournaments: [] });

    const { result } = renderHook(() => useTournaments());

    expect(result.current.isLoading).toBe(true);
  });

  it("should handle network errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useTournaments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.tournaments).toHaveLength(0);
  });

  it("should respond to tournamentAdded event", async () => {
    mockFetch({ success: true, tournaments: [] });

    const { result } = renderHook(() => useTournaments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear the initial fetch call
    (global.fetch as jest.Mock).mockClear();

    // Setup new response for the refresh
    const newTournaments = [createMockTournament()];
    mockFetch({ success: true, tournaments: newTournaments });

    // Trigger event
    window.dispatchEvent(new Event("tournamentAdded"));

    // Wait for the fetch to be called
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
  });

  it("maps database tournament_results onto result", async () => {
    mockFetch({
      success: true,
      tournaments: [
        {
          id: "1",
          name: "Live",
          venue: "SPF",
          buyin: 100,
          date: "2024-01-01T00:00:00Z",
          user_id: "user-1",
          tournament_results: [
            {
              id: "r1",
              tournament_id: "1",
              position: 3,
              payout: 250,
              profit: 150,
              roi: 150,
              rebuy_count: 1,
              final_table_reached: true,
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useTournaments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tournaments[0].result).toEqual(
      expect.objectContaining({
        position: 3,
        payout: 250,
        profit: 150,
        rebuyCount: 1,
        finalTableReached: true,
      }),
    );
  });
});
