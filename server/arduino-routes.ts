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
   * Query params: sessionCode (optional, uses active session if not provided)
   */
  app.get("/api/arduino/classroom-status", async (req, res) => {
    try {
      const { sessionCode } = req.query;

      let session;
      let code = sessionCode as string | undefined;

      if (code) {
        session = await db.getSessionByCode(code);
        if (!session) {
          return res.status(404).json({
            success: false,
            error: "Session not found",
            message: `No session found with code: ${code}`,
          });
        }
      } else {
        session = await db.getActiveSession();
        if (!session) {
          return res.status(404).json({
            success: false,
            error: "No active session",
            message: "There is no active classroom session at this moment",
          });
        }
        code = session.sessionCode;
      }

      const studentCount = await db.getStudentCount(code);
      const mockCurrentTemp = 22.5; // In production, this comes from Arduino sensor
      const calculation = calculateOptimalTemperature(mockCurrentTemp, studentCount);

      return res.json({
        success: true,
        sessionCode: code,
        sessionName: session.name,
        studentCount,
        currentTemperature: mockCurrentTemp,
        targetTemperature: calculation.targetTemperature,
        comfortStatus: calculation.comfortStatus,
        season: calculation.season,
        shouldEnableVentilation: calculation.shouldEnableVentilation,
        recommendedFanSpeed: calculation.recommendedFanSpeed,
      });
    } catch (error) {
      console.error("[Arduino] Error getting classroom status:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve classroom status",
      });
    }
  });

  /**
   * POST /api/arduino/update-students
   * Updates student list for a session
   * Body: { sessionCode, students: [{id, firstName, lastName}, ...] }
   */
  app.post("/api/arduino/update-students", async (req, res) => {
    try {
      const { sessionCode, students } = req.body;

      if (!sessionCode || typeof sessionCode !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid sessionCode",
          message: "sessionCode must be a non-empty string",
        });
      }

      if (!Array.isArray(students)) {
        return res.status(400).json({
          success: false,
          error: "Invalid students array",
          message: "students must be an array of student objects",
        });
      }

      // Create or update session
      await db.createOrUpdateSession(sessionCode, `Session ${sessionCode}`);

      // Add students
      for (const student of students) {
        if (student.id && student.firstName && student.lastName) {
          await db.addStudentToSession(
            sessionCode,
            student.id,
            student.firstName,
            student.lastName
          );
        }
      }

      const finalCount = await db.getStudentCount(sessionCode);

      return res.json({
        success: true,
        message: `Updated ${students.length} students`,
        sessionCode,
        studentCount: finalCount,
      });
    } catch (error) {
      console.error("[Arduino] Error updating students:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to update students",
      });
    }
  });

  /**
   * GET /api/arduino/session/:sessionCode/students
   * Get all students in a session
   */
  app.get("/api/arduino/session/:sessionCode/students", async (req, res) => {
    try {
      const { sessionCode } = req.params;

      const students = await db.getSessionStudents(sessionCode);

      return res.json({
        success: true,
        sessionCode,
        studentCount: students.length,
        students,
      });
    } catch (error) {
      console.error("[Arduino] Error getting session students:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve students",
      });
    }
  });

  /**
   * POST /api/arduino/temperature-log
   * Log temperature reading from Arduino
   */
  app.post("/api/arduino/temperature-log", async (req, res) => {
    try {
      const {
        sessionCode,
        currentTemperature,
        targetTemperature,
        studentCount,
        comfortStatus,
        season,
      } = req.body;

      if (!sessionCode) {
        return res.status(400).json({
          success: false,
          error: "Missing sessionCode",
        });
      }

      await db.logTemperature(
        sessionCode,
        currentTemperature,
        targetTemperature,
        studentCount,
        comfortStatus,
        season
      );

      return res.json({
        success: true,
        message: "Temperature logged successfully",
      });
    } catch (error) {
      console.error("[Arduino] Error logging temperature:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to log temperature",
      });
    }
  });
}
