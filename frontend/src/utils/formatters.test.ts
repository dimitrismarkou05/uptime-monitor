import { describe, it, expect } from "vitest";
import { formatInterval, formatPercentage, formatDateTime } from "./formatters";

describe("formatInterval", () => {
  it("formats seconds", () => {
    expect(formatInterval(45)).toBe("45s");
  });

  it("formats minutes", () => {
    expect(formatInterval(300)).toBe("5m");
    expect(formatInterval(60)).toBe("1m");
  });

  it("formats hours", () => {
    expect(formatInterval(3600)).toBe("1h");
    expect(formatInterval(7200)).toBe("2h");
  });
});

describe("formatPercentage", () => {
  it("formats to 2 decimals by default", () => {
    expect(formatPercentage(99.1234)).toBe("99.12%");
  });

  it("formats to custom decimals", () => {
    expect(formatPercentage(99.1, 0)).toBe("99%");
  });

  it("handles zero", () => {
    expect(formatPercentage(0)).toBe("0%");
  });
});

describe("formatDateTime", () => {
  it("returns N/A for null/undefined", () => {
    expect(formatDateTime(null)).toBe("N/A");
    expect(formatDateTime(undefined)).toBe("N/A");
  });

  it("formats ISO string", () => {
    const result = formatDateTime("2024-01-15T14:30:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });
});
