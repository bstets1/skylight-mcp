import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTodayDate,
  getDateOffset,
  getDateOffsetFrom,
  parseDate,
  parseTime,
  formatDateForDisplay,
} from "../src/utils/dates.js";

describe("dates", () => {
  describe("getTodayDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns today's date in YYYY-MM-DD format", () => {
      const result = getTodayDate();
      expect(result).toBe("2025-06-15");
    });

    it("respects timezone parameter", () => {
      // Set a time that's still June 14 in LA but June 15 in UTC
      vi.setSystemTime(new Date("2025-06-15T05:00:00Z"));
      const result = getTodayDate("America/Los_Angeles");
      expect(result).toBe("2025-06-14");
    });
  });

  describe("getDateOffset", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns date N days from today", () => {
      expect(getDateOffset(1)).toBe("2025-06-16");
      expect(getDateOffset(7)).toBe("2025-06-22");
      expect(getDateOffset(-1)).toBe("2025-06-14");
    });

    it("handles month boundaries", () => {
      vi.setSystemTime(new Date("2025-06-30T12:00:00Z"));
      expect(getDateOffset(1)).toBe("2025-07-01");
    });

    it("handles year boundaries", () => {
      vi.setSystemTime(new Date("2025-12-31T12:00:00Z"));
      expect(getDateOffset(1)).toBe("2026-01-01");
    });

    it("respects timezone parameter", () => {
      // 2025-06-15T05:00:00Z is still June 14 in LA
      vi.setSystemTime(new Date("2025-06-15T05:00:00Z"));
      expect(getDateOffset(1, "America/Los_Angeles")).toBe("2025-06-15");
      // Without timezone, it's June 16 (June 15 + 1)
      expect(getDateOffset(1)).toBe("2025-06-16");
    });
  });

  describe("getDateOffsetFrom", () => {
    it("returns date N days from a given date string", () => {
      expect(getDateOffsetFrom("2025-06-15", 1)).toBe("2025-06-16");
      expect(getDateOffsetFrom("2025-06-15", 7)).toBe("2025-06-22");
      expect(getDateOffsetFrom("2025-06-15", -1)).toBe("2025-06-14");
    });

    it("handles month boundaries", () => {
      expect(getDateOffsetFrom("2025-06-30", 1)).toBe("2025-07-01");
    });

    it("handles year boundaries", () => {
      expect(getDateOffsetFrom("2025-12-31", 1)).toBe("2026-01-01");
    });
  });

  describe("parseDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Set to a Wednesday
      vi.setSystemTime(new Date("2025-06-18T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns YYYY-MM-DD format unchanged", () => {
      expect(parseDate("2025-01-15")).toBe("2025-01-15");
      expect(parseDate("2024-12-25")).toBe("2024-12-25");
    });

    it("parses 'today'", () => {
      expect(parseDate("today")).toBe("2025-06-18");
      expect(parseDate("TODAY")).toBe("2025-06-18");
      expect(parseDate("  Today  ")).toBe("2025-06-18");
    });

    it("parses 'tomorrow'", () => {
      expect(parseDate("tomorrow")).toBe("2025-06-19");
    });

    it("parses 'yesterday'", () => {
      expect(parseDate("yesterday")).toBe("2025-06-17");
    });

    it("parses day names (next occurrence)", () => {
      // Wednesday June 18, 2025
      expect(parseDate("thursday")).toBe("2025-06-19"); // Tomorrow
      expect(parseDate("friday")).toBe("2025-06-20"); // 2 days
      expect(parseDate("monday")).toBe("2025-06-23"); // 5 days
      expect(parseDate("wednesday")).toBe("2025-06-25"); // Next week (not today)
    });

    it("parses MM/DD/YYYY format", () => {
      expect(parseDate("01/15/2025")).toBe("2025-01-15");
      expect(parseDate("12/25/2024")).toBe("2024-12-25");
      expect(parseDate("1/5/2025")).toBe("2025-01-05");
    });

    it("respects timezone parameter for 'today'", () => {
      // 2025-06-18T05:00:00Z is still June 17 in LA
      vi.setSystemTime(new Date("2025-06-18T05:00:00Z"));
      expect(parseDate("today", "America/Los_Angeles")).toBe("2025-06-17");
      expect(parseDate("today")).toBe("2025-06-18");
    });

    it("respects timezone parameter for 'tomorrow'", () => {
      vi.setSystemTime(new Date("2025-06-18T05:00:00Z"));
      expect(parseDate("tomorrow", "America/Los_Angeles")).toBe("2025-06-18");
    });

    it("rejects invalid month in YYYY-MM-DD and returns as-is", () => {
      // Month 13 fails the 1-12 validation, falls through, new Date returns Invalid Date,
      // so parseDate returns the original input as-is
      expect(parseDate("2026-13-01")).toBe("2026-13-01");
    });

    it("passes basic YYYY-MM-DD validation for day 1-31 even if calendar-invalid", () => {
      // 2026-02-30 passes basic validation (month=2, day=30, both in range)
      // since we only check month 1-12 and day 1-31
      expect(parseDate("2026-02-30")).toBe("2026-02-30");
    });

    it("returns unparseable input as-is", () => {
      expect(parseDate("not a date")).toBe("not a date");
    });
  });

  describe("parseTime", () => {
    it("returns HH:MM format unchanged", () => {
      expect(parseTime("10:00")).toBe("10:00");
      expect(parseTime("14:30")).toBe("14:30");
      expect(parseTime("9:00")).toBe("09:00");
    });

    it("parses 12-hour format with AM", () => {
      expect(parseTime("10:00 AM")).toBe("10:00");
      expect(parseTime("10:00 am")).toBe("10:00");
      expect(parseTime("12:00 AM")).toBe("00:00"); // Midnight
      expect(parseTime("9:30 AM")).toBe("09:30");
    });

    it("parses 12-hour format with PM", () => {
      expect(parseTime("2:00 PM")).toBe("14:00");
      expect(parseTime("2:00 pm")).toBe("14:00");
      expect(parseTime("12:00 PM")).toBe("12:00"); // Noon
      expect(parseTime("11:59 PM")).toBe("23:59");
    });

    it("handles 12:30 AM edge case (should be 00:30)", () => {
      expect(parseTime("12:30 AM")).toBe("00:30");
    });

    it("handles 12:30 PM edge case (should stay 12:30)", () => {
      expect(parseTime("12:30 PM")).toBe("12:30");
    });

    it("returns invalid 24-hour times as-is after validation", () => {
      expect(parseTime("25:99")).toBe("25:99");
      expect(parseTime("24:00")).toBe("24:00");
    });

    it("returns invalid 12-hour times as-is after validation", () => {
      expect(parseTime("13:00 PM")).toBe("13:00 PM");
      expect(parseTime("0:00 AM")).toBe("0:00 AM");
    });

    it("returns unparseable input as-is", () => {
      expect(parseTime("not a time")).toBe("not a time");
    });
  });

  describe("formatDateForDisplay", () => {
    it("formats date for display", () => {
      expect(formatDateForDisplay("2025-06-15")).toMatch(/Sun.*Jun.*15/);
      expect(formatDateForDisplay("2025-12-25")).toMatch(/Thu.*Dec.*25/);
    });
  });
});
