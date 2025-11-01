import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketUpload from "@/components/ocr/TicketUpload";
import { processTicketImage } from "@/services/ocrService";
import { AppProviders } from "@/components/providers/AppProviders";

// Mock OCR service
jest.mock("@/services/ocrService", () => ({
  processTicketImage: jest.fn(),
  validateOCRData: jest.fn(),
  preprocessImage: jest.fn(),
  defaultOCRConfig: {
    language: "eng+rus",
    confidence: 0.7,
    preprocessing: true,
    autoRotate: true,
  },
}));

const mockProcessTicketImage = processTicketImage as jest.MockedFunction<
  typeof processTicketImage
>;

describe("OCR Integration Tests", () => {
  const user = userEvent.setup();
  const mockOnDataExtracted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => "mock-object-url");
    global.URL.revokeObjectURL = jest.fn();

    // Default mock implementation
    mockProcessTicketImage.mockResolvedValue({
      success: true,
      data: {
        name: "Test Tournament",
        buyin: 100,
        venue: "Test Casino",
        date: "2024-12-31T20:00",
        startingStack: 20000,
        tournamentType: "freezeout",
        structure: "NL Hold'em",
      },
      confidence: 0.85,
    });
  });

  it("should handle complete OCR workflow", async () => {
    render(
      <AppProviders>
        <TicketUpload onDataExtracted={mockOnDataExtracted} />
      </AppProviders>,
    );

    // Create a test image file
    const file = new File(["test image content"], "ticket.jpg", {
      type: "image/jpeg",
    });

    // Find file input and upload file
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(fileInput, file);

    // Should show preview
    await waitFor(() => {
      expect(screen.getByText("Предпросмотр билета")).toBeInTheDocument();
    });

    // Start OCR processing
    const processButton = screen.getByText("🤖 Распознать данные");
    await user.click(processButton);

    // Wait for OCR to complete (processing state is too fast to test reliably)
    await waitFor(
      () => {
        expect(screen.getByText("🎯 Извлеченные данные")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify extracted data is displayed
    expect(screen.getByText("Test Tournament")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
    expect(screen.getByText("Test Casino")).toBeInTheDocument();
    expect(screen.getByText("Точность: 85%")).toBeInTheDocument();

    // Apply extracted data
    const applyButton = screen.getByText("✅ Применить к форме");
    await user.click(applyButton);

    // Verify callback was called
    expect(mockOnDataExtracted).toHaveBeenCalledWith({
      name: "Test Tournament",
      buyin: 100,
      venue: "Test Casino",
      date: "2024-12-31T20:00",
      startingStack: 20000,
      tournamentType: "freezeout",
      structure: "NL Hold'em",
    });
  });

  it("should handle OCR failure gracefully", async () => {
    // Mock OCR failure
    mockProcessTicketImage.mockResolvedValue({
      success: false,
      error: "Failed to process image",
    });

    render(
      <AppProviders>
        <TicketUpload onDataExtracted={mockOnDataExtracted} />
      </AppProviders>,
    );

    const file = new File(["test image content"], "ticket.jpg", {
      type: "image/jpeg",
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(fileInput, file);

    const processButton = screen.getByText("🤖 Распознать данные");
    await user.click(processButton);

    // Should handle error and not show extracted data
    await waitFor(
      () => {
        expect(
          screen.queryByText("🎯 Извлеченные данные"),
        ).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(mockOnDataExtracted).not.toHaveBeenCalled();
  });

  it("should handle low confidence results", async () => {
    // Mock low confidence result
    mockProcessTicketImage.mockResolvedValue({
      success: true,
      data: {
        name: "Uncertain Tournament",
        buyin: 50,
        venue: "Unknown Venue",
        date: "2024-12-31T20:00",
        startingStack: 10000,
        tournamentType: "freezeout",
      },
      confidence: 0.4, // Low confidence
    });

    render(
      <AppProviders>
        <TicketUpload onDataExtracted={mockOnDataExtracted} />
      </AppProviders>,
    );

    const file = new File(["blurry image"], "blurry-ticket.jpg", {
      type: "image/jpeg",
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(fileInput, file);

    const processButton = screen.getByText("🤖 Распознать данные");
    await user.click(processButton);

    await waitFor(
      () => {
        expect(screen.getByText("Точность: 40%")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Should show red confidence indicator for low confidence
    const confidenceBadge = screen.getByText("Точность: 40%");
    expect(confidenceBadge).toHaveClass("bg-red-100", "text-red-800");
  });

  it("should handle file size validation", async () => {
    render(
      <AppProviders>
        <TicketUpload onDataExtracted={mockOnDataExtracted} />
      </AppProviders>,
    );

    // Create oversized file (>10MB)
    const oversizedFile = new File(
      ["x".repeat(11 * 1024 * 1024)],
      "large.jpg",
      {
        type: "image/jpeg",
      },
    );

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Mock Object.defineProperty for file size
    Object.defineProperty(oversizedFile, "size", {
      value: 11 * 1024 * 1024,
      writable: false,
    });

    await user.upload(fileInput, oversizedFile);

    // Should not show preview for oversized file
    expect(screen.queryByText("Предпросмотр билета")).not.toBeInTheDocument();
  });

  it("should handle non-image files", async () => {
    render(
      <AppProviders>
        <TicketUpload onDataExtracted={mockOnDataExtracted} />
      </AppProviders>,
    );

    // Create non-image file
    const textFile = new File(["some text"], "document.txt", {
      type: "text/plain",
    });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(fileInput, textFile);

    // Should not show preview for non-image file
    expect(screen.queryByText("Предпросмотр билета")).not.toBeInTheDocument();
  });

  it("should handle drag and drop upload", async () => {
    render(
      <AppProviders>
        <TicketUpload onDataExtracted={mockOnDataExtracted} />
      </AppProviders>,
    );

    const file = new File(["test image"], "dropped-ticket.jpg", {
      type: "image/jpeg",
    });
    const dropZone = screen
      .getByText("Загрузите фото билета турнира")
      .closest("div");

    // Simulate drag and drop
    fireEvent.dragOver(dropZone!, {
      dataTransfer: {
        files: [file],
        types: ["Files"],
      },
    });

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file],
        types: ["Files"],
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Предпросмотр билета")).toBeInTheDocument();
    });
  });

  it("should allow file removal and reset", async () => {
    const user = userEvent.setup();
    const mockOnDataExtracted = jest.fn();

    render(
      <AppProviders>
        <TicketUpload onDataExtracted={mockOnDataExtracted} />
      </AppProviders>,
    );

    const file = new File(["test image"], "ticket.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText("Предпросмотр билета")).toBeInTheDocument();
    });

    // Remove file
    const removeButton = screen.getByText("✕ Удалить");
    await user.click(removeButton);

    // Should return to initial state
    expect(screen.queryByText("Предпросмотр билета")).not.toBeInTheDocument();
    expect(
      screen.getByText("Загрузите фото билета турнира"),
    ).toBeInTheDocument();
  });

  it("should handle multiple confidence levels correctly", async () => {
    const confidenceLevels = [
      { confidence: 0.95, expectedClass: "bg-green-100" },
      { confidence: 0.75, expectedClass: "bg-yellow-100" },
      { confidence: 0.5, expectedClass: "bg-red-100" },
    ];

    for (const { confidence, expectedClass } of confidenceLevels) {
      mockProcessTicketImage.mockResolvedValue({
        success: true,
        data: {
          name: `Tournament ${confidence}`,
          buyin: 100,
          venue: "Test Casino",
          date: "2024-12-31T20:00",
        },
        confidence,
      });

      const { unmount } = render(
        <AppProviders>
          <TicketUpload onDataExtracted={mockOnDataExtracted} />
        </AppProviders>,
      );

      const file = new File(["test"], `ticket-${confidence}.jpg`, {
        type: "image/jpeg",
      });
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      await user.upload(fileInput, file);

      // Wait for preview to appear
      await waitFor(() => {
        expect(screen.getByText("Предпросмотр билета")).toBeInTheDocument();
      });

      // Click the OCR button if it exists
      const ocrButton = screen.queryByText("🤖 Распознать данные");
      if (ocrButton) {
        await user.click(ocrButton);
      }

      await waitFor(
        () => {
          const confidenceBadge = screen.getByText(
            `Точность: ${Math.round(confidence * 100)}%`,
          );
          expect(confidenceBadge).toHaveClass(expectedClass);
        },
        { timeout: 5000 },
      );

      unmount();
      jest.clearAllMocks();
    }
  });
});
