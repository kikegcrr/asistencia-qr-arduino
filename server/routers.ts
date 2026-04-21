import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateArduinoCode, validateArduinoConfig } from "./arduino-generator";
import {
  getActiveSession,
  getSessionById,
  getSessionStudents,
  addStudentToSession,
  createSession,
  getStudentCount,
  logTemperature,
} from "./db";
import { calculateOptimalTemperature } from "./temperature-calculator";

export const appRouter = router({
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
    classroomStatus: publicProcedure
      .input(z.object({ sessionId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        try {
          let session = null;
          let sessionId = input?.sessionId;

          // If no sessionId provided, get the active session
          if (!sessionId) {
            session = await getActiveSession();
            if (!session) {
              return {
                success: false,
                message: "No active session",
                studentCount: 0,
                targetTemperature: 0,
                comfortStatus: "unknown",
              };
            }
            sessionId = session.id;
          } else {
            session = await getSessionById(sessionId);
            if (!session) {
              return {
                success: false,
                message: "Session not found",
                studentCount: 0,
                targetTemperature: 0,
                comfortStatus: "unknown",
              };
            }
          }

          const studentCount = await getStudentCount(sessionId);
          const mockCurrentTemp = 22.5; // In production, this would come from Arduino sensor
          const calculation = calculateOptimalTemperature(mockCurrentTemp, studentCount);

          return {
            success: true,
            sessionId,
            sessionName: session.name,
            studentCount,
            currentTemperature: mockCurrentTemp,
            targetTemperature: calculation.targetTemperature,
            comfortStatus: calculation.comfortStatus,
            season: calculation.season,
            shouldEnableVentilation: calculation.shouldEnableVentilation,
            recommendedFanSpeed: calculation.recommendedFanSpeed,
          };
        } catch (error) {
          console.error("[Arduino] Error getting classroom status:", error);
          return {
            success: false,
            message: "Error retrieving status",
            studentCount: 0,
            targetTemperature: 0,
            comfortStatus: "error",
          };
        }
      }),

    updateStudents: publicProcedure
      .input(
        z.object({
          sessionId: z.number(),
          students: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { sessionId, students } = input;

          // Add students
          for (const student of students) {
            await addStudentToSession(
              sessionId,
              student.id,
              student.name
            );
          }

          return {
            success: true,
            message: `Updated ${students.length} students`,
            studentCount: students.length,
          };
        } catch (error) {
          console.error("[Arduino] Error updating students:", error);
          return {
            success: false,
            message: "Error updating students",
          };
        }
      }),
  }),

  // Session management (internal)
  sessions: router({
    getActive: publicProcedure.query(async () => {
      const session = await getActiveSession();
      return session || null;
    }),

    getById: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return await getSessionById(input.sessionId);
      }),

    getStudents: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return await getSessionStudents(input.sessionId);
      }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createSession(
          input.name,
          input.description
        );
      }),

    list: publicProcedure.query(async () => {
      // In a real app, this would query all sessions
      // For now, return empty array
      return [];
    }),
  }),

  // Arduino code generator
  arduinoGenerator: router({
    generateCode: publicProcedure
      .input(
        z.object({
          ssid: z.string(),
          password: z.string(),
          serverAddress: z.string(),
          serverPort: z.number(),
          sessionId: z.number(),
        })
      )
      .query(async ({ input }) => {
        try {
          const config = {
            ssid: input.ssid,
            password: input.password,
            serverAddress: input.serverAddress,
            serverPort: input.serverPort,
            sessionId: input.sessionId,
          };

          const code = generateArduinoCode(config);
          return {
            success: true,
            code,
            filename: `arduino_climate_${input.sessionId}.ino`,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate Arduino code",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
