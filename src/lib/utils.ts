import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  calculateROI,
  calculateProfit,
  getROIColor,
  getPositionColor,
  getPositionEmoji,
  formatPosition,
} from "./common/formatters";

// Re-export common formatters
export {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  calculateROI,
  calculateProfit,
  getROIColor,
  getPositionColor,
  getPositionEmoji,
  formatPosition,
};

// Utility for combining Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

// Sort tournaments by date
export function sortTournaments<T extends { date: string }>(
  tournaments: T[],
  direction: "asc" | "desc" = "desc",
): T[] {
  return [...tournaments].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return direction === "desc" ? dateB - dateA : dateA - dateB;
  });
}

// Filter tournaments by date range
export function filterTournamentsByDateRange<T extends { date: string }>(
  tournaments: T[],
  startDate?: string,
  endDate?: string,
): T[] {
  return tournaments.filter((tournament) => {
    const tournamentDate = new Date(tournament.date);

    if (startDate && tournamentDate < new Date(startDate)) {
      return false;
    }
    if (endDate && tournamentDate > new Date(endDate)) {
      return false;
    }

    return true;
  });
}

// Group tournaments by month
export function groupTournamentsByMonth<T extends { date: string }>(
  tournaments: T[],
): Record<string, T[]> {
  return tournaments.reduce(
    (groups, tournament) => {
      const date = new Date(tournament.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }

      groups[monthKey].push(tournament);
      return groups;
    },
    {} as Record<string, T[]>,
  );
}

// Convert file to Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Check if file is an image
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

// Format file size in human-readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
