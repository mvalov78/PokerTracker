import {
  processTicketImage,
  validateOCRData,
  preprocessImage,
  defaultOCRConfig,
  cleanTournamentName,
} from "@/services/ocrService";

describe("OCR Service", () => {
  describe("processTicketImage", () => {
    it("should process image file and return OCR result", async () => {
      const mockFile = new File(["test"], "ticket.jpg", { type: "image/jpeg" });

      const result = await processTicketImage(mockFile);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);

      if (result.data) {
        expect(result.data.name).toBeDefined();
        expect(result.data.buyin).toBeDefined();
        expect(result.data.venue).toBeDefined();
      }
    });

    it("should process image URL and return OCR result", async () => {
      const mockUrl = "https://example.com/ticket.jpg";

      const result = await processTicketImage(mockUrl);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should handle processing errors gracefully", async () => {
      // Mock console.error to avoid error output in tests
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Create a mock that will cause an error
      const mockFile = null as any;

      const result = await processTicketImage(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      consoleSpy.mockRestore();
    });

    it("should extract tournament data correctly", async () => {
      const mockFile = new File(["test"], "ticket.jpg", { type: "image/jpeg" });

      const result = await processTicketImage(mockFile);

      if (result.success && result.data) {
        expect(result.data.name).toBeDefined();
        expect(result.data.venue).toBeDefined();
        expect(result.data.buyin).toBe(275);
        expect(result.data.startingStack).toBe(25000);
        expect(result.data.tournamentType).toBe("freezeout");
      }
    });
  });

  describe("validateOCRData", () => {
    it("should validate complete tournament data", () => {
      const validData = {
        name: "Test Tournament",
        buyin: 100,
        date: "2024-01-15T18:00",
        venue: "Test Casino",
        startingStack: 20000,
      };

      const result = validateOCRData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should return errors for missing required fields", () => {
      const incompleteData = {
        venue: "Test Casino",
      };

      const result = validateOCRData(incompleteData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Не удалось определить название турнира");
      expect(result.errors).toContain("Не удалось определить бай-ин");
      expect(result.errors).toContain("Не удалось определить дату турнира");
    });

    it("should return warnings for missing optional fields", () => {
      const dataWithMissingOptional = {
        name: "Test Tournament",
        buyin: 100,
        date: "2024-01-15T18:00",
      };

      const result = validateOCRData(dataWithMissingOptional);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("Место проведения не определено");
      expect(result.warnings).toContain("Стартовый стек не определен");
    });

    it("should warn about unusual buyin amounts", () => {
      const dataWithUnusualBuyin = {
        name: "Test Tournament",
        buyin: 150000, // Very high buyin
        date: "2024-01-15T18:00",
        venue: "Test Casino",
      };

      const result = validateOCRData(dataWithUnusualBuyin);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("Необычный размер бай-ина");
    });

    it("should handle empty or invalid values", () => {
      const invalidData = {
        name: "",
        buyin: 0,
        date: "",
        venue: "",
        startingStack: 0,
      };

      const result = validateOCRData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Не удалось определить название турнира");
      expect(result.errors).toContain("Не удалось определить бай-ин");
      expect(result.errors).toContain("Не удалось определить дату турнира");
      expect(result.warnings).toContain("Место проведения не определено");
      expect(result.warnings).toContain("Стартовый стек не определен");
    });
  });

  describe("preprocessImage", () => {
    it("should preprocess image file", async () => {
      const mockFile = new File(["test"], "ticket.jpg", { type: "image/jpeg" });

      const result = await preprocessImage(mockFile);

      expect(result).toBe(mockFile); // Mock implementation returns the same file
      expect(result.name).toBe("ticket.jpg");
      expect(result.type).toBe("image/jpeg");
    });

    it("should handle preprocessing with delay", async () => {
      const mockFile = new File(["test"], "ticket.jpg", { type: "image/jpeg" });
      const startTime = Date.now();

      await preprocessImage(mockFile);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should take at least ~500ms due to mock delay (allowing small tolerance for timing precision)
      expect(processingTime).toBeGreaterThanOrEqual(490);
    });
  });

  describe("defaultOCRConfig", () => {
    it("should have correct default configuration", () => {
      expect(defaultOCRConfig.language).toBe("eng+rus");
      expect(defaultOCRConfig.confidence).toBe(0.7);
      expect(defaultOCRConfig.preprocessing).toBe(true);
      expect(defaultOCRConfig.autoRotate).toBe(true);
    });
  });

  describe("OCR text extraction patterns", () => {
    it("should recognize RPF tournament patterns", async () => {
      const mockFile = new File(["test"], "rpf-ticket.jpg", {
        type: "image/jpeg",
      });

      const result = await processTicketImage(mockFile);

      if (result.success && result.data) {
        expect(result.data.name).toBeDefined();
        expect(result.data.venue).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0.8);
      }
    });

    it("should handle unknown ticket formats", async () => {
      // This would test fallback behavior for unrecognized formats
      const mockFile = new File(["unknown format"], "unknown.jpg", {
        type: "image/jpeg",
      });

      const result = await processTicketImage(mockFile);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.tournamentType).toBe("freezeout"); // Default fallback
        expect(result.data.structure).toBe("NL Hold'em"); // Default fallback
      }
    });
  });

  describe("cleanTournamentName", () => {
    it("should remove event number at the beginning", () => {
      expect(cleanTournamentName("#8 RUSSIAN POKER OPEN")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("EVENT#8 RUSSIAN POKER OPEN")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("Event 8 RUSSIAN POKER OPEN")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("№8 RUSSIAN POKER OPEN")).toBe("RUSSIAN POKER OPEN");
    });

    it("should remove day number at the end", () => {
      expect(cleanTournamentName("RUSSIAN POKER OPEN Day 1")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("RUSSIAN POKER OPEN Day 2")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("RUSSIAN POKER OPEN Dag 1")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("RUSSIAN POKER OPEN День 1")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("RUSSIAN POKER OPEN D1")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("RUSSIAN POKER OPEN Flight A")).toBe("RUSSIAN POKER OPEN");
    });

    it("should remove day with letter suffix", () => {
      expect(cleanTournamentName("RUSSIAN POKER OPEN Day 1A")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("RUSSIAN POKER OPEN Day 1B")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("RUSSIAN POKER OPEN 1A")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("RUSSIAN POKER OPEN 1B")).toBe("RUSSIAN POKER OPEN");
    });

    it("should remove both event number and day", () => {
      expect(cleanTournamentName("#8 RUSSIAN POKER OPEN Day 1")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("EVENT#8 RUSSIAN POKER OPEN Day 2")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("Event 15 MAIN EVENT Day 1A")).toBe("MAIN EVENT");
    });

    it("should handle names without event number or day", () => {
      expect(cleanTournamentName("RUSSIAN POKER OPEN")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("Sunday Million")).toBe("Sunday Million");
      expect(cleanTournamentName("Main Event")).toBe("Main Event");
    });

    it("should handle empty or invalid input", () => {
      expect(cleanTournamentName("")).toBe("");
      expect(cleanTournamentName("   ")).toBe("");
    });

    it("should clean extra whitespace", () => {
      expect(cleanTournamentName("  RUSSIAN   POKER   OPEN  ")).toBe("RUSSIAN POKER OPEN");
      expect(cleanTournamentName("#8    RUSSIAN POKER OPEN   Day 1")).toBe("RUSSIAN POKER OPEN");
    });
  });
});
