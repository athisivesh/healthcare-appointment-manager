const { z } = require("zod");

const workingHoursSchema = z
  .object({
    weekday: z.enum([
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
]),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "startTime must be HH:mm"),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "endTime must be HH:mm"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "startTime must be before endTime",
    path: ["endTime"],
  });

const leaveSchema = z.object({
  leaveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "leaveDate must be YYYY-MM-DD"),
  reason: z.string().max(500).optional(),
});

const slotsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

const doctorSearchQuerySchema = z.object({
  specialisation: z.string().trim().min(1).optional(),
});

module.exports = {
  workingHoursSchema,
  leaveSchema,
  slotsQuerySchema,
  doctorSearchQuerySchema,
};