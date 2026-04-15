import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Classroom Session table: represents an active classroom session
 */
export const classroomSessions = mysqlTable("classroom_sessions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  isActive: int("is_active").default(0).notNull(), // 0 = inactive, 1 = active
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClassroomSession = typeof classroomSessions.$inferSelect;
export type InsertClassroomSession = typeof classroomSessions.$inferInsert;

/**
 * Student Attendance table: tracks student attendance in sessions
 */
export const studentAttendance = mysqlTable("student_attendance", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  studentId: varchar("student_id", { length: 255 }).notNull(), // External student ID from QR system
  studentName: varchar("student_name", { length: 255 }).notNull(),
  checkInTime: timestamp("check_in_time").defaultNow().notNull(),
  checkOutTime: timestamp("check_out_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type StudentAttendance = typeof studentAttendance.$inferSelect;
export type InsertStudentAttendance = typeof studentAttendance.$inferInsert;

/**
 * Temperature Log table: stores temperature readings and comfort status
 */
export const temperatureLogs = mysqlTable("temperature_logs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  currentTemperature: decimal("current_temperature", { precision: 5, scale: 2 }).notNull(),
  targetTemperature: decimal("target_temperature", { precision: 5, scale: 2 }).notNull(),
  studentCount: int("student_count").notNull(),
  comfortStatus: varchar("comfort_status", { length: 50 }).notNull(), // "comfortable", "too_hot", "too_cold"
  season: varchar("season", { length: 50 }).notNull(), // "winter", "summer"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TemperatureLog = typeof temperatureLogs.$inferSelect;
export type InsertTemperatureLog = typeof temperatureLogs.$inferInsert;