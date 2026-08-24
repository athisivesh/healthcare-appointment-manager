const { z } = require("zod");

const symptomFormSchema = z.object({
  symptomsText: z
    .string()
    .trim()
    .min(1, "Symptoms are required")
    .max(5000, "Symptoms are too long"),
});

const appointmentIdParamSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID"),
});

const postVisitNotesSchema = z.object({
  doctorNotes: z
    .string()
    .trim()
    .min(1, "Doctor notes are required")
    .max(10000, "Doctor notes are too long"),

  prescriptionText: z
    .string()
    .trim()
    .max(10000, "Prescription is too long")
    .optional(),
});

module.exports = {
  symptomFormSchema,
  appointmentIdParamSchema,
  postVisitNotesSchema,
};