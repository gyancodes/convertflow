import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import PreviewComparison from "../PreviewComparison";
import { ProcessingResult } from "../../../types/converter";

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(global.URL, "createObjectURL", {
  value: mockCreateObjectURL,
  writable: true,
});

Object.defineProperty(global.URL, "revokeObjectURL", {
  value: mockRevokeObjectURL,
  writable: true,
});

describe("PreviewComparison", () => {
  const mockFile = new File(["test"], "test.png", { type: "image/png" });
  const mockResult: ProcessingResult = {
    svgContent: '<svg><rect width="100" height="100" fill="red"/></svg>',
    originalSize: 1024,
    vectorSize: 512,
    processingTime: 1500,
    colorCount: 5,
    pathCount: 3,
  };

  const mockOnDownload = vi.fn();

  beforeEach(() => {
    mockCreateObjectURL.mockReturnValue("mock-url");
    mockRevokeObjectURL.mockClear();
    mockOnDownload.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render loading state correctly", () => {
      render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
          loading={true}
        />
      );

      expect(screen.getByText("Generating preview...")).toBeInTheDocument();
      expect(
        screen.getByText("Generating preview...").previousElementSibling
      ).toHaveClass("animate-spin");
    });

    it("should render preview comparison when not loading", () => {
      render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText("Preview & Comparison")).toBeInTheDocument();
      expect(screen.getAllByText("Original PNG")).toHaveLength(2); // One in size display, one in image overlay
      expect(screen.getAllByText("Generated SVG")).toHaveLength(2); // One in size display, one in image overlay
      expect(screen.getByText("Download SVG")).toBeInTheDocument();
    });

    it("should create and revoke object URLs correctly", async () => {
      const { unmount } = render(
        <PreviewComparison originalFile={mockFile} result={mockResult} />
      );

      // Should create URLs for both original and SVG
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));

      // Should revoke URLs on unmount
      unmount();
      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("File Size Display", () => {
    it("should display file sizes correctly", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      expect(screen.getByText("1 KB")).toBeInTheDocument(); // Original size
      expect(screen.getByText("512 B")).toBeInTheDocument(); // Vector size
    });

    it("should calculate and display size reduction percentage", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      // (1024 - 512) / 1024 * 100 = 50%
      expect(screen.getByText("-50.0%")).toBeInTheDocument();
    });

    it("should handle size increase correctly", () => {
      const largerResult = {
        ...mockResult,
        vectorSize: 2048, // Larger than original
      };

      render(
        <PreviewComparison originalFile={mockFile} result={largerResult} />
      );

      // Should show positive percentage for size increase
      expect(screen.getByText("+100.0%")).toBeInTheDocument();
    });

    it("should format large file sizes correctly", () => {
      const largeResult = {
        ...mockResult,
        originalSize: 1048576, // 1MB
        vectorSize: 2097152, // 2MB
      };

      render(
        <PreviewComparison originalFile={mockFile} result={largeResult} />
      );

      expect(screen.getByText("1 MB")).toBeInTheDocument();
      expect(screen.getByText("2 MB")).toBeInTheDocument();
    });
  });

  describe("Zoom Controls", () => {
    it("should display initial zoom level", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should handle zoom in", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      const zoomInButton = screen.getByTitle("Zoom In");
      fireEvent.click(zoomInButton);

      expect(screen.getByText("120%")).toBeInTheDocument();
    });

    it("should handle zoom out", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      const zoomOutButton = screen.getByTitle("Zoom Out");
      fireEvent.click(zoomOutButton);

      expect(screen.getByText("83%")).toBeInTheDocument();
    });

    it("should handle zoom reset", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      // Zoom in first
      const zoomInButton = screen.getByTitle("Zoom In");
      fireEvent.click(zoomInButton);
      expect(screen.getByText("120%")).toBeInTheDocument();

      // Then reset
      const resetButton = screen.getByTitle("Reset Zoom");
      fireEvent.click(resetButton);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should limit zoom range", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      const zoomInButton = screen.getByTitle("Zoom In");
      const zoomOutButton = screen.getByTitle("Zoom Out");

      // Test zoom in limit (5.0x = 500%)
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomInButton);
      }
      expect(screen.getByText("500%")).toBeInTheDocument();

      // Reset and test zoom out limit (0.1x = 10%)
      const resetButton = screen.getByTitle("Reset Zoom");
      fireEvent.click(resetButton);

      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomOutButton);
      }
      expect(screen.getByText("10%")).toBeInTheDocument();
    });
  });

  describe("Mouse Wheel Zoom", () => {
    it("should zoom in on wheel up", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      const container = screen
        .getByRole("img", { name: "Original PNG" })
        .closest(".relative");
      if (container) {
        fireEvent.wheel(container, { deltaY: -100 });
        expect(screen.getByText("110%")).toBeInTheDocument();
      }
    });

    it("should zoom out on wheel down", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      const container = screen
        .getByRole("img", { name: "Original PNG" })
        .closest(".relative");
      if (container) {
        fireEvent.wheel(container, { deltaY: 100 });
        expect(screen.getByText("90%")).toBeInTheDocument();
      }
    });
  });

  describe("Pan Functionality", () => {
    it("should show pan instruction when zoomed in", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      // Zoom in first
      const zoomInButton = screen.getByTitle("Zoom In");
      fireEvent.click(zoomInButton);

      expect(screen.getByText("Click and drag to pan")).toBeInTheDocument();
    });

    it("should not show pan instruction at 100% zoom", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      expect(
        screen.queryByText("Click and drag to pan")
      ).not.toBeInTheDocument();
    });

    it("should handle mouse drag for panning", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      const container = screen
        .getByRole("img", { name: "Original PNG" })
        .closest(".relative");
      if (container) {
        // Start drag
        fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });

        // Move mouse
        fireEvent.mouseMove(container, { clientX: 150, clientY: 150 });

        // End drag
        fireEvent.mouseUp(container);

        // Verify the transform style was applied (indirectly through DOM)
        const originalImg = screen.getByRole("img", { name: "Original PNG" });
        expect(originalImg).toHaveStyle(
          "transform: translate(50px, 50px) scale(1)"
        );
      }
    });
  });

  describe("Processing Information Display", () => {
    it("should display processing statistics", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      expect(screen.getByText(/Processing time: 1500ms/)).toBeInTheDocument();
      expect(screen.getByText(/Colors: 5/)).toBeInTheDocument();
      expect(screen.getByText(/Paths: 3/)).toBeInTheDocument();
    });
  });

  describe("Download Functionality", () => {
    it("should call onDownload when download button is clicked", () => {
      render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
          onDownload={mockOnDownload}
        />
      );

      const downloadButton = screen.getByText("Download SVG");
      fireEvent.click(downloadButton);

      expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });

    it("should not render download button when onDownload is not provided", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      expect(screen.queryByText("Download SVG")).not.toBeInTheDocument();
    });
  });

  describe("Image Display", () => {
    it("should render both original and SVG images", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      const originalImg = screen.getByRole("img", { name: "Original PNG" });
      const svgImg = screen.getByRole("img", { name: "Generated SVG" });

      expect(originalImg).toBeInTheDocument();
      expect(svgImg).toBeInTheDocument();
      expect(originalImg).toHaveAttribute("src", "mock-url");
      expect(svgImg).toHaveAttribute("src", "mock-url");
    });

    it("should apply transform styles to images", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      const originalImg = screen.getByRole("img", { name: "Original PNG" });
      const svgImg = screen.getByRole("img", { name: "Generated SVG" });

      expect(originalImg).toHaveStyle(
        "transform: translate(0px, 0px) scale(1)"
      );
      expect(svgImg).toHaveStyle("transform: translate(0px, 0px) scale(1)");
    });
  });

  describe("Accessibility", () => {
    it("should have proper alt text for images", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      expect(
        screen.getByRole("img", { name: "Original PNG" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("img", { name: "Generated SVG" })
      ).toBeInTheDocument();
    });

    it("should have proper button titles for zoom controls", () => {
      render(<PreviewComparison originalFile={mockFile} result={mockResult} />);

      expect(screen.getByTitle("Zoom In")).toBeInTheDocument();
      expect(screen.getByTitle("Zoom Out")).toBeInTheDocument();
      expect(screen.getByTitle("Reset Zoom")).toBeInTheDocument();
    });
  });
});
