import { and, eq, isNull, sql } from "drizzle-orm";
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
 * Get the currently active classroom session
 */
export async function getActiveSession(): Promise<ClassroomSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(classroomSessions)
    .where(eq(classroomSessions.isActive, 1))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all students in an active session
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
 * Add or update a student in a session
 */
export async function upsertStudentAttendance(
  sessionId: number,
  studentId: string,
  studentName: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db
    .select()
    .from(studentAttendance)
    .where(
      and(
        eq(studentAttendance.sessionId, sessionId),
        eq(studentAttendance.studentId, studentId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Student already checked in, update check-out time if needed
    return existing[0];
  }

  // New attendance record
  await db.insert(studentAttendance).values({
    sessionId,
    studentId,
    studentName,
    checkInTime: new Date(),
  });

  return { sessionId, studentId, studentName };
}

/**
 * Remove a student from a session (check-out)
 */
export async function checkoutStudent(sessionId: number, studentId: string) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(studentAttendance)
    .set({ checkOutTime: new Date() })
    .where(
      and(
        eq(studentAttendance.sessionId, sessionId),
        eq(studentAttendance.studentId, studentId),
        isNull(studentAttendance.checkOutTime)
      )
    );
}

/**
 * Get count of active students (checked in but not checked out)
 */
export async function getActiveStudentCount(sessionId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(studentAttendance)
    .where(
      and(
        eq(studentAttendance.sessionId, sessionId),
        isNull(studentAttendance.checkOutTime)
      )
    );

  return result[0]?.count || 0;
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

  await db.insert(temperatureLogs).values({
    sessionId: sessionId,
    currentTemperature: currentTemperature.toString(),
    targetTemperature: targetTemperature.toString(),
    studentCount: studentCount,
    comfortStatus: comfortStatus,
    season: season,
  });
}

/**
 * Create a new classroom session
 */
export async function createSession(
  name: string,
  description: string | undefined,
  createdBy: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(classroomSessions).values({
    name,
    description,
    startTime: new Date(),
    createdBy,
    isActive: 0,
  });

  return result;
}

/**
 * Activate a session
 */
export async function activateSession(sessionId: number) {
  const db = await getDb();
  if (!db) return undefined;

  // Deactivate all other sessions first
  await db
    .update(classroomSessions)
    .set({ isActive: 0 })
    .where(eq(classroomSessions.isActive, 1));

  // Activate the selected session
  await db
    .update(classroomSessions)
    .set({ isActive: 1 })
    .where(eq(classroomSessions.id, sessionId));
}

/**
 * Close a session
 */
export async function closeSession(sessionId: number) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(classroomSessions)
    .set({ isActive: 0, endTime: new Date() })
    .where(eq(classroomSessions.id, sessionId));
}

/**
 * Get session history with pagination
 */
export async function getSessionHistory(limit: number = 10, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(classroomSessions)
    .orderBy(sql`${classroomSessions.startTime} DESC`)
    .limit(limit)
    .offset(offset);
}
