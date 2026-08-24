require("dotenv").config();

const { z } = require("zod");

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default("1h"),
});

const env = envSchema.parse(process.env);

module.exports = { env };