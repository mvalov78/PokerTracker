import {
  formatTooltipValue,
  formatDate,
  getRoiColor,
  getDefaultTooltipStyles,
} from "@/components/charts/utils/formatting";

describe("Chart formatting utilities", () => {
  describe("formatTooltipValue", () => {
    it("formats profit values correctly", () => {
      const [value, label] = formatTooltipValue(1000, "profit");
      expect(value).toBe("$1,000.00");
      expect(label).toBe("Прибыль");
    });

    it("formats cumulative values correctly", () => {
      const [value, label] = formatTooltipValue(5000, "cumulative");
      expect(value).toBe("$5,000.00");
      expect(label).toBe("Накопительная прибыль");
    });

    it("formats roi values correctly", () => {
      const [value, label] = formatTooltipValue(15.5, "roi");
      expect(value).toBe("15.50%");
      expect(label).toBe("ROI");
    });

    it("formats tournaments values correctly", () => {
      const [value, label] = formatTooltipValue(42, "tournaments");
      expect(value).toBe("42");
      expect(label).toBe("Турниров");
    });

    it("handles unknown types by returning them as is", () => {
      const [value, label] = formatTooltipValue(100, "unknown");
      expect(value).toBe("100");
      expect(label).toBe("unknown");
    });
  });

  describe("formatDate", () => {
    it("formats date strings correctly", () => {
      const formatted = formatDate("2025-10-30");
      // Russian format DD.MM
      expect(formatted).toMatch(/\d{2}\.\d{2}/);
    });
  });

  describe("getRoiColor", () => {
    it("returns green for excellent ROI", () => {
      expect(getRoiColor(25)).toBe("#10b981");
    });

    it("returns yellow for positive ROI", () => {
      expect(getRoiColor(15)).toBe("#f59e0b");
    });

    it("returns red for negative ROI", () => {
      expect(getRoiColor(-5)).toBe("#ef4444");
    });
  });

  describe("getDefaultTooltipStyles", () => {
    it("returns the expected default styles", () => {
      const styles = getDefaultTooltipStyles();
      expect(styles).toEqual({
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        border: "none",
        borderRadius: "8px",
        color: "white",
      });
    });
  });
});
