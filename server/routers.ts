import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateArduinoCode, validateArduinoConfig } from "./arduino-generator";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Arduino public endpoints (no authentication required)
  arduino: router({
    classroomStatus: publicProcedure.query(async () => {
      const { getActiveSession, getActiveStudentCount } = await import("./db");
      const { calculateOptimalTemperature } = await import("./temperature-calculator");

      const session = await getActiveSession();
      if (!session) {
        return {
          success: false,
          message: "No active session",
          studentCount: 0,
          targetTemperature: 0,
          comfortStatus: "unknown",
        };
      }

      const studentCount = await getActiveStudentCount(session.id);
      const mockCurrentTemp = 22.5; // In production, this would come from Arduino sensor
      const calculation = calculateOptimalTemperature(mockCurrentTemp, studentCount);

      return {
        success: true,
        sessionId: session.id,
        sessionName: session.name,
        studentCount,
        currentTemperature: mockCurrentTemp,
        targetTemperature: calculation.targetTemperature,
        comfortStatus: calculation.comfortStatus,
        season: calculation.season,
      };
    }),

    updateStudents: publicProcedure
      .input(
        z.object({
          action: z.enum(["checkin", "checkout"]),
          studentId: z.string(),
          studentName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getActiveSession, upsertStudentAttendance, checkoutStudent } =
          await import("./db");

        const session = await getActiveSession();
        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active session",
          });
        }

        if (input.action === "checkin") {
          await upsertStudentAttendance(
            session.id,
            input.studentId,
            input.studentName
          );
        } else if (input.action === "checkout") {
          await checkoutStudent(session.id, input.studentId);
        }

        return { success: true, action: input.action };
      }),
  }),

  // Session management (protected)
  sessions: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { createSession } = await import("./db");
        await createSession(input.name, input.description, ctx.user.id);
        return { success: true };
      }),

    activate: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input }) => {
        const { activateSession } = await import("./db");
        await activateSession(input.sessionId);
        return { success: true };
      }),

    close: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input }) => {
        const { closeSession } = await import("./db");
        await closeSession(input.sessionId);
        return { success: true };
      }),

    getActive: publicProcedure.query(async () => {
      const { getActiveSession, getActiveStudentCount, getSessionStudents } =
        await import("./db");

      const session = await getActiveSession();
      if (!session) return null;

      const studentCount = await getActiveStudentCount(session.id);
      const students = await getSessionStudents(session.id);

      return {
        id: session.id,
        name: session.name,
        studentCount,
        students,
        startTime: session.startTime,
      };
    }),

    list: protectedProcedure.query(async () => {
      const { getSessionHistory } = await import("./db");
      return await getSessionHistory(50, 0);
    }),
  }),

  arduinoGen: router({
    generateCode: publicProcedure
      .input(
        z.object({
          ssid: z.string().min(1),
          password: z.string().min(1),
          serverAddress: z.string().min(1),
          serverPort: z.number().min(1).max(65535),
          sessionCode: z.string().min(1),
        })
      )
      .mutation(({ input }) => {
        const validation = validateArduinoConfig(input);
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: validation.errors.join(", "),
          });
        }

        const code = generateArduinoCode(input);

        return {
          success: true,
          code,
          filename: "arduino_classroom_status.ino",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
