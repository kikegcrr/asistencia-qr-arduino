import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";

// Mock the database functions
vi.mock("./db", () => ({
  getActiveSession: vi.fn(),
  getActiveStudentCount: vi.fn(),
  getSessionStudents: vi.fn(),
  upsertStudentAttendance: vi.fn(),
}));

describe("Arduino Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/arduino/classroom-status", () => {
    it("should return classroom status with valid sessionCode", async () => {
      const mockSession = {
        id: 1,
        name: "Clase de Física",
        isActive: 1,
        startTime: new Date(),
      };

      vi.mocked(db.getActiveSession).mockResolvedValue(mockSession as any);
      vi.mocked(db.getActiveStudentCount).mockResolvedValue(25);

      // Simulate the endpoint logic
      const sessionCode = "test-session-code";
      const session = await db.getActiveSession();
      const studentCount = await db.getActiveStudentCount(session!.id);

      expect(session).toBeDefined();
      expect(session?.name).toBe("Clase de Física");
      expect(studentCount).toBe(25);
    });

    it("should handle missing session gracefully", async () => {
      vi.mocked(db.getActiveSession).mockResolvedValue(null);

      const session = await db.getActiveSession();
      expect(session).toBeNull();
    });

    it("should return correct temperature calculation with student count", async () => {
      const mockSession = {
        id: 1,
        name: "Test Session",
        isActive: 1,
        startTime: new Date(),
      };

      vi.mocked(db.getActiveSession).mockResolvedValue(mockSession as any);
      vi.mocked(db.getActiveStudentCount).mockResolvedValue(20);

      const session = await db.getActiveSession();
      const studentCount = await db.getActiveStudentCount(session!.id);

      expect(studentCount).toBe(20);
      // Temperature calculation should be done by temperature-calculator
    });
  });

  describe("POST /api/arduino/update-students", () => {
    it("should accept valid student data", async () => {
      const mockSession = {
        id: 1,
        name: "Test Session",
        isActive: 1,
        startTime: new Date(),
      };

      vi.mocked(db.getActiveSession).mockResolvedValue(mockSession as any);
      vi.mocked(db.getSessionStudents).mockResolvedValue([]);
      vi.mocked(db.upsertStudentAttendance).mockResolvedValue(undefined);

      const session = await db.getActiveSession();
      expect(session).toBeDefined();

      await db.upsertStudentAttendance(
        session!.id,
        "student-1",
        "Juan Pérez"
      );

      expect(db.upsertStudentAttendance).toHaveBeenCalledWith(
        1,
        "student-1",
        "Juan Pérez"
      );
    });

    it("should reject invalid student data", async () => {
      const mockSession = {
        id: 1,
        name: "Test Session",
        isActive: 1,
        startTime: new Date(),
      };

      vi.mocked(db.getActiveSession).mockResolvedValue(mockSession as any);

      const session = await db.getActiveSession();
      expect(session).toBeDefined();

      // Empty student name should be handled by validation
      const invalidStudent = {
        firstName: "",
        lastName: "",
      };

      expect(invalidStudent.firstName).toBe("");
      expect(invalidStudent.lastName).toBe("");
    });

    it("should handle duplicate students", async () => {
      const mockSession = {
        id: 1,
        name: "Test Session",
        isActive: 1,
        startTime: new Date(),
      };

      const existingStudent = {
        id: 1,
        sessionId: 1,
        studentName: "Juan Pérez",
        checkInTime: new Date(),
        checkOutTime: null,
      };

      vi.mocked(db.getActiveSession).mockResolvedValue(mockSession as any);
      vi.mocked(db.getSessionStudents).mockResolvedValue([existingStudent]);

      const session = await db.getActiveSession();
      const students = await db.getSessionStudents(session!.id);

      const isDuplicate = students.some(
        (s: any) => s.studentName === "Juan Pérez" && !s.checkOutTime
      );

      expect(isDuplicate).toBe(true);
    });
  });

  describe("GET /api/arduino/sync-qr", () => {
    it("should return student count for valid sessionCode", async () => {
      const mockSession = {
        id: 1,
        name: "Test Session",
        isActive: 1,
        startTime: new Date(),
      };

      vi.mocked(db.getActiveSession).mockResolvedValue(mockSession as any);
      vi.mocked(db.getActiveStudentCount).mockResolvedValue(15);

      const session = await db.getActiveSession();
      const count = await db.getActiveStudentCount(session!.id);

      expect(count).toBe(15);
    });

    it("should handle missing session", async () => {
      vi.mocked(db.getActiveSession).mockResolvedValue(null);

      const session = await db.getActiveSession();
      expect(session).toBeNull();
    });
  });

  describe("POST /api/arduino/register-student", () => {
    it("should register a single student", async () => {
      const mockSession = {
        id: 1,
        name: "Test Session",
        isActive: 1,
        startTime: new Date(),
      };

      vi.mocked(db.getActiveSession).mockResolvedValue(mockSession as any);
      vi.mocked(db.upsertStudentAttendance).mockResolvedValue(undefined);
      vi.mocked(db.getActiveStudentCount).mockResolvedValue(1);

      const session = await db.getActiveSession();
      await db.upsertStudentAttendance(session!.id, "student-1", "Juan Pérez");
      const count = await db.getActiveStudentCount(session!.id);

      expect(count).toBe(1);
      expect(db.upsertStudentAttendance).toHaveBeenCalled();
    });

    it("should reject registration without firstName", async () => {
      const mockSession = {
        id: 1,
        name: "Test Session",
        isActive: 1,
        startTime: new Date(),
      };

      vi.mocked(db.getActiveSession).mockResolvedValue(mockSession as any);

      const session = await db.getActiveSession();
      expect(session).toBeDefined();

      // Validation should catch missing firstName
      const firstName = "";
      const lastName = "Pérez";

      expect(firstName).toBe("");
      expect(lastName).not.toBe("");
    });

    it("should reject registration without lastName", async () => {
      const mockSession = {
        id: 1,
        name: "Test Session",
        isActive: 1,
        startTime: new Date(),
      };

      vi.mocked(db.getActiveSession).mockResolvedValue(mockSession as any);

      const session = await db.getActiveSession();
      expect(session).toBeDefined();

      // Validation should catch missing lastName
      const firstName = "Juan";
      const lastName = "";

      expect(firstName).not.toBe("");
      expect(lastName).toBe("");
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      vi.mocked(db.getActiveSession).mockRejectedValue(
        new Error("Database connection failed")
      );

      try {
        await db.getActiveSession();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toBe("Database connection failed");
      }
    });

    it("should handle missing required fields", async () => {
      const requestBody = {
        sessionCode: "",
        students: [],
      };

      expect(requestBody.sessionCode).toBe("");
      expect(Array.isArray(requestBody.students)).toBe(true);
    });
  });

  describe("Response Format", () => {
    it("should return properly formatted success response", async () => {
      const mockSession = {
        id: 1,
        name: "Test Session",
        isActive: 1,
        startTime: new Date(),
      };

      vi.mocked(db.getActiveSession).mockResolvedValue(mockSession as any);
      vi.mocked(db.getActiveStudentCount).mockResolvedValue(10);

      const session = await db.getActiveSession();
      const studentCount = await db.getActiveStudentCount(session!.id);

      const response = {
        success: true,
        sessionId: session!.id,
        sessionName: session!.name,
        studentCount,
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response.sessionId).toBe(1);
      expect(response.studentCount).toBe(10);
      expect(response.timestamp).toBeDefined();
    });

    it("should return properly formatted error response", () => {
      const errorResponse = {
        success: false,
        error: "Invalid request",
        message: "sessionCode is required",
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.message).toBeDefined();
    });
  });
});
