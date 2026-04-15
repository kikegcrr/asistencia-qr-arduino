/**
 * Arduino REST Routes
 * Public endpoints for Arduino integration and QR app synchronization
 * No authentication required
 */

import { Express } from "express";
import * as db from "./db";
import { calculateOptimalTemperature } from "./temperature-calculator";

export function registerArduinoRoutes(app: Express) {
  /**
   * GET /api/arduino/classroom-status
   * Returns current classroom status with student count and temperature recommendations
   * Query params: sessionCode (required)
   */
  app.get("/api/arduino/classroom-status", async (req, res) => {
    try {
      const { sessionCode } = req.query;

      if (!sessionCode || typeof sessionCode !== "string") {
        return res.status(400).json({
          success: false,
          error: "sessionCode is required",
          message: "Please provide a valid sessionCode query parameter",
        });
      }

      // Get session from our database using sessionCode
      const session = await db.getActiveSession();
      if (!session) {
        return res.status(404).json({
          success: false,
          error: "No active session",
          message: "There is no active classroom session at this moment",
        });
      }

      const studentCount = await db.getActiveStudentCount(session.id);
      const mockCurrentTemp = 22.5; // In production, this comes from Arduino sensor
      const calculation = calculateOptimalTemperature(mockCurrentTemp, studentCount);

      return res.json({
        success: true,
        sessionId: session.id,
        sessionName: session.name,
        studentCount,
        currentTemperature: mockCurrentTemp,
        targetTemperature: calculation.targetTemperature,
        comfortStatus: calculation.comfortStatus,
        season: calculation.season,
        explanation: calculation.explanation,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Arduino Routes] Error in /api/arduino/classroom-status:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while processing your request",
      });
    }
  });

  /**
   * POST /api/arduino/update-students
   * Receives student attendance updates from QR app
   * Body: { sessionCode: string, students: Array<{firstName, lastName, registeredAt}> }
   */
  app.post("/api/arduino/update-students", async (req, res) => {
    try {
      const { sessionCode, students } = req.body;

      if (!sessionCode || typeof sessionCode !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid request",
          message: "sessionCode is required and must be a string",
        });
      }

      if (!Array.isArray(students)) {
        return res.status(400).json({
          success: false,
          error: "Invalid request",
          message: "students must be an array",
        });
      }

      // Get active session
      const session = await db.getActiveSession();
      if (!session) {
        return res.status(404).json({
          success: false,
          error: "No active session",
          message: "There is no active classroom session to sync students to",
        });
      }

      // Process each student
      let addedCount = 0;
      const errors: string[] = [];

      for (const student of students) {
        try {
          if (!student.firstName || !student.lastName) {
            errors.push(`Student missing name: ${JSON.stringify(student)}`);
            continue;
          }

          // Check if student already exists
          const existing = await db.getSessionStudents(session.id);
          const isDuplicate = existing.some(
            (s: any) =>
              s.studentName === `${student.firstName} ${student.lastName}` &&
              !s.checkOutTime
          );

          if (!isDuplicate) {
            await db.upsertStudentAttendance(
              session.id,
              `${student.firstName}-${student.lastName}-${Date.now()}`,
              `${student.firstName} ${student.lastName}`
            );
            addedCount++;
          }
        } catch (error) {
          errors.push(`Error processing student ${student.firstName} ${student.lastName}`);
        }
      }

      return res.json({
        success: true,
        message: `Synchronized ${addedCount} students`,
        addedCount,
        totalStudents: students.length,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Arduino Routes] Error in /api/arduino/update-students:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while processing your request",
      });
    }
  });

  /**
   * GET /api/arduino/sync-qr
   * Endpoint for QR app to sync student data
   * Query params: sessionCode (required)
   * Returns: { count, sessionCode, sessionId, classroomId, classroomName, maxCapacity, status, timestamp }
   */
  app.get("/api/arduino/sync-qr", async (req, res) => {
    try {
      const { sessionCode } = req.query;

      if (!sessionCode || typeof sessionCode !== "string") {
        return res.status(400).json({
          success: false,
          error: "sessionCode is required",
          count: 0,
        });
      }

      // Get active session
      const session = await db.getActiveSession();
      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
          count: 0,
        });
      }

      const studentCount = await db.getActiveStudentCount(session.id);

      return res.json({
        success: true,
        count: studentCount,
        sessionCode,
        sessionId: session.id,
        sessionName: session.name,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Arduino Routes] Error in /api/arduino/sync-qr:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        count: 0,
      });
    }
  });

  /**
   * POST /api/arduino/register-student
   * Direct student registration endpoint
   * Body: { sessionCode: string, firstName: string, lastName: string }
   */
  app.post("/api/arduino/register-student", async (req, res) => {
    try {
      const { sessionCode, firstName, lastName } = req.body;

      if (!sessionCode || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
          message: "sessionCode, firstName, and lastName are required",
        });
      }

      // Get active session
      const session = await db.getActiveSession();
      if (!session) {
        return res.status(404).json({
          success: false,
          error: "No active session",
          message: "There is no active classroom session",
        });
      }

      // Register student
      await db.upsertStudentAttendance(
        session.id,
        `${firstName}-${lastName}-${Date.now()}`,
        `${firstName} ${lastName}`
      );

      const studentCount = await db.getActiveStudentCount(session.id);

      return res.json({
        success: true,
        message: `Student ${firstName} ${lastName} registered successfully`,
        studentCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Arduino Routes] Error in /api/arduino/register-student:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while registering the student",
      });
    }
  });
}
