/**
 * Интеграционные тесты для API
 */

const { createMocks } = require("node-mocks-http");

// Mock Supabase для API тестов
jest.mock("@/lib/supabase", () => ({
  supabase: null, // Будет использовать fallback к mockData
  supabaseAdmin: null,
}));

describe("API Integration Tests", () => {
  describe("/api/tournaments", () => {
    it("should handle GET request for tournaments", async () => {
      const { GET } = await import("@/app/api/tournaments/route");

      const { req, res } = createMocks({
        method: "GET",
        query: { userId: "test-user" },
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.tournaments)).toBe(true);
    });

    it("should handle POST request for creating tournament", async () => {
      const { POST } = await import("@/app/api/tournaments/route");

      const tournamentData = {
        userId: "test-user",
        name: "Test Tournament",
        buyin: 100,
        venue: "Test Casino",
        date: "2024-12-31T20:00:00Z",
      };

      const { req } = createMocks({
        method: "POST",
        body: tournamentData,
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.tournament.name).toBe("Test Tournament");
    });

    it("should handle DELETE request for tournament", async () => {
      const { DELETE } = await import("@/app/api/tournaments/route");

      const { req } = createMocks({
        method: "DELETE",
        query: { id: "test-id" },
      });

      const response = await DELETE(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("/api/tournaments/[id]", () => {
    it("should handle GET request for specific tournament", async () => {
      const { GET } = await import("@/app/api/tournaments/[id]/route");

      const { req } = createMocks({
        method: "GET",
      });

      // Mock params
      const params = Promise.resolve({ id: "test-id" });

      const response = await GET(req as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should handle PUT request for updating tournament", async () => {
      const { PUT } = await import("@/app/api/tournaments/[id]/route");

      const updateData = {
        result: {
          position: 1,
          payout: 500,
          notes: "Great game!",
        },
      };

      const { req } = createMocks({
        method: "PUT",
        body: updateData,
      });

      const params = Promise.resolve({ id: "test-id" });

      const response = await PUT(req as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

describe("Bot API Tests", () => {
  describe("/api/bot/polling", () => {
    it("should handle bot polling start", async () => {
      const { POST } = await import("@/app/api/bot/polling/route");

      const { req } = createMocks({
        method: "POST",
        body: { command: "start" },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should handle bot polling stop", async () => {
      const { POST } = await import("@/app/api/bot/polling/route");

      const { req } = createMocks({
        method: "POST",
        body: { command: "stop" },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

describe("Data Consistency Tests", () => {
  it("should maintain data consistency between bot and frontend", async () => {
    const { POST: createTournament } = await import(
      "@/app/api/tournaments/route"
    );
    const { GET: getTournaments } = await import("@/app/api/tournaments/route");

    // Create tournament via bot
    const tournamentData = {
      userId: "consistency-test",
      name: "Consistency Test Tournament",
      buyin: 200,
      venue: "Test Venue",
      date: new Date().toISOString(),
    };

    const { req: createReq } = createMocks({
      method: "POST",
      body: tournamentData,
    });

    const createResponse = await createTournament(createReq as any);
    const createData = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createData.success).toBe(true);

    // Fetch tournaments via frontend
    const { req: getReq } = createMocks({
      method: "GET",
      query: { userId: "consistency-test" },
    });

    const getResponse = await getTournaments(getReq as any);
    const getData = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(getData.success).toBe(true);

    // Check if created tournament exists in the list
    const createdTournament = getData.tournaments.find(
      (t: any) => t.name === "Consistency Test Tournament",
    );
    expect(createdTournament).toBeDefined();
    expect(createdTournament.buyin).toBe(200);
  });

  it("should handle venue priority correctly", async () => {
    const { POST } = await import("@/app/api/tournaments/route");

    // Test tournament creation with venue
    const tournamentData = {
      userId: "venue-test",
      name: "Venue Priority Test",
      buyin: 150,
      venue: "Priority Casino", // This should be used
      date: new Date().toISOString(),
    };

    const { req } = createMocks({
      method: "POST",
      body: tournamentData,
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.tournament.venue).toBe("Priority Casino");
  });
});
