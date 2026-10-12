import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  formatDateTime,
  formatDateTimeFull,
  formatTime,
  isYesterday,
  padZero,
} from "./formatTime";

describe("formatDateTime", () => {
  // Freeze the current date for consistent testing
  const mockDate = new Date("2024-09-23T15:30:00");

  beforeEach(() => {
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the seconds ago format for time difference of less than a minute", () => {
    const tenSecondsAgo = new Date(mockDate.getTime() - 10 * 1000);
    expect(formatDateTime(tenSecondsAgo)).toBe("10 sekunder siden");
  });

  it("should return the minutes ago format for time difference of less than an hour", () => {
    const fiveMinutesAgo = new Date(mockDate.getTime() - 5 * 60 * 1000);
    expect(formatDateTime(fiveMinutesAgo)).toBe("5 minutter siden");
  });

  it("should return the hours ago format for time difference of less than 24 hours", () => {
    const threeHoursAgo = new Date(mockDate.getTime() - 3 * 60 * 60 * 1000);
    expect(formatDateTime(threeHoursAgo)).toBe("3 timer siden");
  });

  it('should return "yesterday" format if the date is the previous day', () => {
    const yesterday = new Date("2024-09-22T15:30:00");
    expect(formatDateTime(yesterday)).toBe("kl. 15:30 i går");
  });

  it("should return full date and time for dates older than yesterday", () => {
    const olderDate = new Date("2024-09-20T12:15:00");
    expect(formatDateTime(olderDate)).toBe("12:15 20-09-2024 ");
  });
});

describe("isYesterday", () => {
  it("should return true if the first date is the day before the second date", () => {
    const d1 = new Date("2024-09-22T23:00:00");
    const d2 = new Date("2024-09-23T00:01:00");
    expect(isYesterday(d1, d2)).toBe(true);
  });

  it("should return false if the first date is not the day before the second date", () => {
    const d1 = new Date("2024-09-21T15:00:00");
    const d2 = new Date("2024-09-23T15:00:00");
    expect(isYesterday(d1, d2)).toBe(false);
  });

  it("should return false if both dates are the same day", () => {
    const d1 = new Date("2024-09-23T10:00:00");
    const d2 = new Date("2024-09-23T15:00:00");
    expect(isYesterday(d1, d2)).toBe(false);
  });
  it("should return false if second date is before first date", () => {
    const d1 = new Date("2024-09-23T10:00:00");
    const d2 = new Date("2024-09-22T15:00:00");
    expect(isYesterday(d1, d2)).toBe(false);
  });
});

describe("formatTime", () => {
  it("should format time with padded zeroes for hours and minutes", () => {
    const date = new Date("2024-09-23T08:05:00");
    expect(formatTime(date)).toBe("08:05");
  });

  it("should format time correctly for double-digit hours and minutes", () => {
    const date = new Date("2024-09-23T15:30:00");
    expect(formatTime(date)).toBe("15:30");
  });
});

describe("formatDateTimeFull", () => {
  it("should format the date and time with padded zeroes", () => {
    const date = new Date("2024-09-23T08:05:00");
    expect(formatDateTimeFull(date)).toBe("08:05 23-09-2024 ");
  });

  it("should format correctly for dates with double-digit months and days", () => {
    const date = new Date("2024-11-11T12:45:00");
    expect(formatDateTimeFull(date)).toBe("12:45 11-11-2024 ");
  });
});

describe("padZero", () => {
  it("should return the number as a string with a leading zero if less than 10", () => {
    expect(padZero(5)).toBe("05");
  });

  it("should return the number as a string without a leading zero if 10 or greater", () => {
    expect(padZero(10)).toBe("10");
    expect(padZero(15)).toBe("15");
  });
});
