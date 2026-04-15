import { describe, it, expect } from "vitest";
import {
  calculateOptimalTemperature,
  isValidTemperatureReading,
  getComfortStatusColor,
  getComfortStatusLabel,
} from "./temperature-calculator";

describe("Temperature Calculator", () => {
  describe("calculateOptimalTemperature", () => {
    it("should calculate winter baseline temperature correctly", () => {
      const winterDate = new Date(2026, 0, 15, 12, 0); // January 15, 2026, noon
      const result = calculateOptimalTemperature(22, 0, winterDate);

      expect(result.season).toBe("winter");
      expect(result.targetTemperature).toBeGreaterThanOrEqual(19);
      expect(result.targetTemperature).toBeLessThanOrEqual(25);
    });

    it("should calculate summer baseline temperature correctly", () => {
      const summerDate = new Date(2026, 6, 15, 12, 0); // July 15, 2026, noon
      const result = calculateOptimalTemperature(25, 0, summerDate);

      expect(result.season).toBe("summer");
      expect(result.targetTemperature).toBeGreaterThanOrEqual(22);
      expect(result.targetTemperature).toBeLessThanOrEqual(28);
    });

    it("should reduce target temperature with more students", () => {
      const date = new Date(2026, 0, 15, 12, 0); // Winter, noon
      const result0 = calculateOptimalTemperature(22, 0, date);
      const result10 = calculateOptimalTemperature(22, 10, date);
      const result20 = calculateOptimalTemperature(22, 20, date);

      expect(result10.targetTemperature).toBeLessThan(result0.targetTemperature);
      expect(result20.targetTemperature).toBeLessThan(result10.targetTemperature);
    });

    it("should adjust temperature based on time of day", () => {
      const morningDate = new Date(2026, 0, 15, 8, 0);
      const noonDate = new Date(2026, 0, 15, 12, 0);
      const eveningDate = new Date(2026, 0, 15, 20, 0);

      const morningResult = calculateOptimalTemperature(22, 10, morningDate);
      const noonResult = calculateOptimalTemperature(22, 10, noonDate);
      const eveningResult = calculateOptimalTemperature(22, 10, eveningDate);

      expect(morningResult.targetTemperature).not.toBe(noonResult.targetTemperature);
      expect(eveningResult.targetTemperature).not.toBe(noonResult.targetTemperature);
    });

    it("should correctly identify comfortable status", () => {
      const date = new Date(2026, 0, 15, 12, 0);
      const result = calculateOptimalTemperature(21.5, 5, date);

      expect(result.comfortStatus).toBe("comfortable");
    });

    it("should correctly identify too hot status", () => {
      const date = new Date(2026, 0, 15, 12, 0);
      const result = calculateOptimalTemperature(25, 5, date);

      expect(result.comfortStatus).toBe("too_hot");
    });

    it("should correctly identify too cold status", () => {
      const date = new Date(2026, 0, 15, 12, 0);
      const result = calculateOptimalTemperature(18, 5, date);

      expect(result.comfortStatus).toBe("too_cold");
    });

    it("should clamp target temperature within bounds", () => {
      const winterDate = new Date(2026, 0, 15, 12, 0);
      const result = calculateOptimalTemperature(22, 100, winterDate); // Many students

      expect(result.targetTemperature).toBeGreaterThanOrEqual(19);
      expect(result.targetTemperature).toBeLessThanOrEqual(25);
    });

    it("should include explanation in result", () => {
      const date = new Date(2026, 0, 15, 12, 0);
      const result = calculateOptimalTemperature(22, 10, date);

      expect(result.explanation).toBeTruthy();
      expect(result.explanation).toContain("Invierno");
      expect(result.explanation).toContain("10");
    });
  });

  describe("isValidTemperatureReading", () => {
    it("should accept valid temperature readings", () => {
      expect(isValidTemperatureReading(20)).toBe(true);
      expect(isValidTemperatureReading(22.5)).toBe(true);
      expect(isValidTemperatureReading(5)).toBe(true);
      expect(isValidTemperatureReading(40)).toBe(true);
    });

    it("should reject invalid temperature readings", () => {
      expect(isValidTemperatureReading(4.9)).toBe(false);
      expect(isValidTemperatureReading(40.1)).toBe(false);
      expect(isValidTemperatureReading(-10)).toBe(false);
      expect(isValidTemperatureReading(100)).toBe(false);
    });
  });

  describe("getComfortStatusColor", () => {
    it("should return correct color for comfortable status", () => {
      expect(getComfortStatusColor("comfortable")).toBe("#4ade80");
    });

    it("should return correct color for too_hot status", () => {
      expect(getComfortStatusColor("too_hot")).toBe("#f87171");
    });

    it("should return correct color for too_cold status", () => {
      expect(getComfortStatusColor("too_cold")).toBe("#60a5fa");
    });

    it("should return gray for unknown status", () => {
      expect(getComfortStatusColor("unknown" as any)).toBe("#9ca3af");
    });
  });

  describe("getComfortStatusLabel", () => {
    it("should return correct label for comfortable status", () => {
      expect(getComfortStatusLabel("comfortable")).toBe("Confortable");
    });

    it("should return correct label for too_hot status", () => {
      expect(getComfortStatusLabel("too_hot")).toBe("Demasiado Calor");
    });

    it("should return correct label for too_cold status", () => {
      expect(getComfortStatusLabel("too_cold")).toBe("Demasiado Frío");
    });

    it("should return unknown for unrecognized status", () => {
      expect(getComfortStatusLabel("unknown" as any)).toBe("Desconocido");
    });
  });

  describe("Season Detection", () => {
    it("should correctly identify winter months", () => {
      const winterMonths = [1, 2, 3, 4, 10, 11, 12];
      winterMonths.forEach((month) => {
        const date = new Date(2026, month - 1, 15, 12, 0);
        const result = calculateOptimalTemperature(22, 0, date);
        expect(result.season).toBe("winter");
      });
    });

    it("should correctly identify summer months", () => {
      const summerMonths = [5, 6, 7, 8, 9];
      summerMonths.forEach((month) => {
        const date = new Date(2026, month - 1, 15, 12, 0);
        const result = calculateOptimalTemperature(22, 0, date);
        expect(result.season).toBe("summer");
      });
    });
  });

  describe("Occupancy Impact", () => {
    it("should have greater occupancy impact in summer than winter", () => {
      const winterDate = new Date(2026, 0, 15, 12, 0);
      const summerDate = new Date(2026, 6, 15, 12, 0);

      const winterNoStudents = calculateOptimalTemperature(22, 0, winterDate);
      const winterWith20Students = calculateOptimalTemperature(22, 20, winterDate);

      const summerNoStudents = calculateOptimalTemperature(25, 0, summerDate);
      const summerWith20Students = calculateOptimalTemperature(25, 20, summerDate);

      const winterDifference = winterNoStudents.targetTemperature - winterWith20Students.targetTemperature;
      const summerDifference = summerNoStudents.targetTemperature - summerWith20Students.targetTemperature;

      expect(summerDifference).toBeGreaterThan(winterDifference);
    });
  });
});
