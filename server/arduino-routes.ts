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
   * Query params: sessionId (optional, uses active session if not provided)
   */
  app.get("/api/arduino/classroom-status", async (req, res) => {
    try {
      const { sessionId } = req.query;

      let session;
      let id = sessionId ? parseInt(sessionId as string) : undefined;

      if (id) {
        session = await db.getSessionById(id);
        if (!session) {
          return res.status(404).json({
            success: false,
            error: "Session not found",
            message: `No session found with id: ${id}`,
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
        id = session.id;
      }

      const studentCount = await db.getStudentCount(id);
      const mockCurrentTemp = 22.5; // In production, this comes from Arduino sensor
      const calculation = calculateOptimalTemperature(mockCurrentTemp, studentCount);

      return res.json({
        success: true,
        sessionId: id,
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
   * Body: { sessionId, students: [{id, name}, ...] }
   */
  app.post("/api/arduino/update-students", async (req, res) => {
    try {
      const { sessionId, students } = req.body;

      if (!sessionId || typeof sessionId !== "number") {
        return res.status(400).json({
          success: false,
          error: "Invalid sessionId",
          message: "sessionId must be a number",
        });
      }

      if (!Array.isArray(students)) {
        return res.status(400).json({
          success: false,
          error: "Invalid students array",
          message: "students must be an array of student objects",
        });
      }

      // Add students
      for (const student of students) {
        if (student.id && student.name) {
          await db.addStudentToSession(
            sessionId,
            student.id,
            student.name
          );
        }
      }

      const finalCount = await db.getStudentCount(sessionId);

      return res.json({
        success: true,
        message: `Updated ${students.length} students`,
        sessionId,
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
   * GET /api/arduino/session/:sessionId/students
   * Get all students in a session
   */
  app.get("/api/arduino/session/:sessionId/students", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const id = parseInt(sessionId);

      const students = await db.getSessionStudents(id);

      return res.json({
        success: true,
        sessionId: id,
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
        sessionId,
        currentTemperature,
        targetTemperature,
        studentCount,
        comfortStatus,
        season,
      } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "Missing sessionId",
        });
      }

      await db.logTemperature(
        sessionId,
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
