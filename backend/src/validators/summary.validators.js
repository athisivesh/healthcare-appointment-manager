const { z } = require("zod");

const appointmentIdParamSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID"),
});

module.exports = {
  appointmentIdParamSchema,
};