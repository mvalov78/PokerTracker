import {
  cn,
  formatCurrency,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  calculateROI,
  calculateProfit,
  generateId,
  isValidEmail,
  debounce,
  throttle,
  truncateText,
  getInitials,
  getROIColor,
  getPositionColor,
  getPositionEmoji,
  formatPosition,
  sortTournaments,
  filterTournamentsByDateRange,
  groupTournamentsByMonth,
  isImageFile,
  formatFileSize,
} from "@/lib/utils";

// Mock Date для тестов относительного времени
const mockDate = new Date("2024-01-15T12:00:00Z");

describe("Utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      expect(cn("px-4", "py-2")).toBe("px-4 py-2");
      expect(cn("px-4", "px-2")).toBe("px-2"); // Tailwind merge should handle conflicts
    });
  });

  describe("formatCurrency", () => {
    it("should format currency with default USD", () => {
      expect(formatCurrency(100)).toBe("$100");
      expect(formatCurrency(100.5)).toBe("$100.5");
      expect(formatCurrency(1000)).toBe("$1,000");
    });

    it("should format currency with custom currency", () => {
      expect(formatCurrency(100, "EUR")).toBe("€100");
    });
  });

  describe("formatPercentage", () => {
    it("should format percentage with default decimals", () => {
      expect(formatPercentage(15.5)).toBe("15.5%");
      expect(formatPercentage(100)).toBe("100.0%");
    });

    it("should format percentage with custom decimals", () => {
      expect(formatPercentage(15.555, 2)).toBe("15.55%");
    });
  });

  describe("formatDate", () => {
    it("should format date string", () => {
      const result = formatDate("2024-01-15T12:00:00Z");
      expect(result).toContain("15");
      expect(result).toContain("янв");
      expect(result).toContain("2024");
    });

    it("should format Date object", () => {
      const date = new Date("2024-01-15T12:00:00Z");
      const result = formatDate(date);
      expect(result).toContain("15");
    });
  });

  describe("formatRelativeTime", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "только что" for recent times', () => {
      const recentDate = new Date(mockDate.getTime() - 30000); // 30 seconds ago
      expect(formatRelativeTime(recentDate)).toBe("только что");
    });

    it("should return minutes for times less than an hour", () => {
      const minutesAgo = new Date(mockDate.getTime() - 5 * 60 * 1000); // 5 minutes ago
      expect(formatRelativeTime(minutesAgo)).toBe("5 мин назад");
    });

    it("should return hours for times less than a day", () => {
      const hoursAgo = new Date(mockDate.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
      expect(formatRelativeTime(hoursAgo)).toBe("3 ч назад");
    });

    it("should return days for times less than a month", () => {
      const daysAgo = new Date(mockDate.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      expect(formatRelativeTime(daysAgo)).toBe("5 дн назад");
    });
  });

  describe("calculateROI", () => {
    it("should calculate positive ROI", () => {
      expect(calculateROI(100, 200)).toBe(100);
    });

    it("should calculate negative ROI", () => {
      expect(calculateROI(100, 50)).toBe(-50);
    });

    it("should return 0 for zero buyin", () => {
      expect(calculateROI(0, 100)).toBe(0);
    });

    it("should calculate break-even ROI", () => {
      expect(calculateROI(100, 100)).toBe(0);
    });
  });

  describe("calculateProfit", () => {
    it("should calculate profit", () => {
      expect(calculateProfit(100, 200)).toBe(100);
    });

    it("should calculate loss", () => {
      expect(calculateProfit(100, 50)).toBe(-50);
    });

    it("should calculate break-even", () => {
      expect(calculateProfit(100, 100)).toBe(0);
    });
  });

  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("test@domain")).toBe(false);
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it("should debounce function calls", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(150);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("throttle", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it("should throttle function calls", () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(150);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("truncateText", () => {
    it("should truncate long text", () => {
      expect(truncateText("This is a long text", 10)).toBe("This is a ...");
    });

    it("should not truncate short text", () => {
      expect(truncateText("Short", 10)).toBe("Short");
    });
  });

  describe("getInitials", () => {
    it("should get initials from full name", () => {
      expect(getInitials("John Doe")).toBe("JD");
      expect(getInitials("John Michael Doe")).toBe("JM");
    });

    it("should handle single name", () => {
      expect(getInitials("John")).toBe("J");
    });
  });

  describe("getROIColor", () => {
    it("should return green for positive ROI", () => {
      expect(getROIColor(10)).toBe("text-emerald-600 dark:text-emerald-400");
    });

    it("should return red for negative ROI", () => {
      expect(getROIColor(-10)).toBe("text-red-600 dark:text-red-400");
    });

    it("should return gray for zero ROI", () => {
      expect(getROIColor(0)).toBe("text-gray-600 dark:text-gray-400");
    });
  });

  describe("getPositionColor", () => {
    it("should return gold for 1st place", () => {
      expect(getPositionColor(1)).toBe("text-yellow-600 dark:text-yellow-400");
    });

    it("should return silver for 2nd place", () => {
      expect(getPositionColor(2)).toBe("text-gray-600 dark:text-gray-400");
    });

    it("should return bronze for 3rd place", () => {
      expect(getPositionColor(3)).toBe("text-amber-600 dark:text-amber-400");
    });

    it("should return green for ITM positions", () => {
      expect(getPositionColor(5)).toBe(
        "text-emerald-600 dark:text-emerald-400",
      );
      expect(getPositionColor(10)).toBe(
        "text-emerald-600 dark:text-emerald-400",
      );
    });

    it("should return gray for out of money", () => {
      expect(getPositionColor(15)).toBe("text-gray-600 dark:text-gray-400");
    });
  });

  describe("getPositionEmoji", () => {
    it("should return correct emojis for positions", () => {
      expect(getPositionEmoji(1)).toBe("🥇");
      expect(getPositionEmoji(2)).toBe("🥈");
      expect(getPositionEmoji(3)).toBe("🥉");
      expect(getPositionEmoji(5)).toBe("💰");
      expect(getPositionEmoji(15)).toBe("❌");
    });
  });

  describe("formatPosition", () => {
    it("should format positions with correct suffixes", () => {
      expect(formatPosition(1)).toBe("1st");
      expect(formatPosition(2)).toBe("2nd");
      expect(formatPosition(3)).toBe("3rd");
      expect(formatPosition(4)).toBe("4th");
      expect(formatPosition(21)).toBe("21st");
      expect(formatPosition(22)).toBe("22nd");
      expect(formatPosition(23)).toBe("23rd");
    });
  });

  describe("sortTournaments", () => {
    const tournaments = [
      { date: "2024-01-10T12:00:00Z", name: "Tournament A" },
      { date: "2024-01-15T12:00:00Z", name: "Tournament B" },
      { date: "2024-01-05T12:00:00Z", name: "Tournament C" },
    ];

    it("should sort tournaments in descending order by default", () => {
      const sorted = sortTournaments(tournaments);
      expect(sorted[0].name).toBe("Tournament B");
      expect(sorted[1].name).toBe("Tournament A");
      expect(sorted[2].name).toBe("Tournament C");
    });

    it("should sort tournaments in ascending order", () => {
      const sorted = sortTournaments(tournaments, "asc");
      expect(sorted[0].name).toBe("Tournament C");
      expect(sorted[1].name).toBe("Tournament A");
      expect(sorted[2].name).toBe("Tournament B");
    });
  });

  describe("filterTournamentsByDateRange", () => {
    const tournaments = [
      { date: "2024-01-05T12:00:00Z", name: "Tournament A" },
      { date: "2024-01-15T12:00:00Z", name: "Tournament B" },
      { date: "2024-01-25T12:00:00Z", name: "Tournament C" },
    ];

    it("should filter by start date", () => {
      const filtered = filterTournamentsByDateRange(tournaments, "2024-01-10");
      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe("Tournament B");
      expect(filtered[1].name).toBe("Tournament C");
    });

    it("should filter by end date", () => {
      const filtered = filterTournamentsByDateRange(
        tournaments,
        undefined,
        "2024-01-20",
      );
      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe("Tournament A");
      expect(filtered[1].name).toBe("Tournament B");
    });

    it("should filter by date range", () => {
      const filtered = filterTournamentsByDateRange(
        tournaments,
        "2024-01-10",
        "2024-01-20",
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Tournament B");
    });
  });

  describe("groupTournamentsByMonth", () => {
    const tournaments = [
      { date: "2024-01-05T12:00:00Z", name: "Tournament A" },
      { date: "2024-01-15T12:00:00Z", name: "Tournament B" },
      { date: "2024-02-05T12:00:00Z", name: "Tournament C" },
    ];

    it("should group tournaments by month", () => {
      const grouped = groupTournamentsByMonth(tournaments);
      expect(Object.keys(grouped)).toEqual(["2024-01", "2024-02"]);
      expect(grouped["2024-01"]).toHaveLength(2);
      expect(grouped["2024-02"]).toHaveLength(1);
    });
  });

  describe("isImageFile", () => {
    it("should identify image files", () => {
      const imageFile = new File([""], "test.jpg", { type: "image/jpeg" });
      const textFile = new File([""], "test.txt", { type: "text/plain" });

      expect(isImageFile(imageFile)).toBe(true);
      expect(isImageFile(textFile)).toBe(false);
    });
  });

  describe("formatFileSize", () => {
    it("should format file sizes correctly", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(1073741824)).toBe("1 GB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
    });
  });
});
