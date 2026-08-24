const { z } = require("zod");

const createHoldSchema = z.object({
  doctorId: z.string().uuid(),
  slotStart: z.string().datetime(),
});

const appointmentIdSchema = z.object({
  appointmentId: z.string().uuid(),
});

module.exports = {
  createHoldSchema,
  appointmentIdSchema,
};