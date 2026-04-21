import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, classroomSessions, studentAttendance, temperatureLogs } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Import types for database operations
import type { ClassroomSession, StudentAttendance as StudentAttendanceRecord } from "../drizzle/schema";

/**
 * Get the currently active classroom session (most recent one)
 */
export async function getActiveSession(): Promise<ClassroomSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(classroomSessions)
    .orderBy((t) => t.startTime)
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId: number): Promise<ClassroomSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(classroomSessions)
    .where(eq(classroomSessions.id, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all students in a session by sessionId
 */
export async function getSessionStudents(sessionId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(studentAttendance)
    .where(eq(studentAttendance.sessionId, sessionId));
}

/**
 * Add a student to a session
 */
export async function addStudentToSession(
  sessionId: number,
  studentId: string,
  studentName: string
) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(studentAttendance).values({
      sessionId,
      studentId,
      studentName,
      checkInTime: new Date(),
      createdAt: new Date(),
    });

    return result;
  } catch (error) {
    console.error("[Database] Failed to add student:", error);
    return undefined;
  }
}

/**
 * Create a new classroom session
 */
export async function createSession(
  name: string,
  description?: string
) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(classroomSessions).values({
      name,
      description,
      startTime: new Date(),
      isActive: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return result;
  } catch (error) {
    console.error("[Database] Failed to create session:", error);
    return undefined;
  }
}

/**
 * Get count of students in a session
 */
export async function getStudentCount(sessionId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(studentAttendance)
    .where(eq(studentAttendance.sessionId, sessionId));

  return result.length;
}

/**
 * Log temperature reading
 */
export async function logTemperature(
  sessionId: number,
  currentTemperature: number,
  targetTemperature: number,
  studentCount: number,
  comfortStatus: string,
  season: string
) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    return await db.insert(temperatureLogs).values({
      sessionId,
      currentTemperature: currentTemperature.toString(),
      targetTemperature: targetTemperature.toString(),
      studentCount,
      comfortStatus,
      season,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[Database] Failed to log temperature:", error);
    return undefined;
  }
}
