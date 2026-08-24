const { z } = require("zod");

const createDoctorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(150),
  specialisation: z.string().trim().min(1).max(150),
  slotDurationMinutes: z
    .number()
    .int()
    .min(5)
    .max(240),
});

const updateDoctorSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  specialisation: z.string().trim().min(1).max(150).optional(),
  slotDurationMinutes: z
    .number()
    .int()
    .min(5)
    .max(240)
    .optional(),
});

module.exports = {
  createDoctorSchema,
  updateDoctorSchema,
};