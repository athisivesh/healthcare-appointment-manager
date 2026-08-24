const { z } = require("zod");
const { registerUser, loginUser } = require("../services/auth.service");

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["PATIENT", "DOCTOR"]),
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().optional(),
  dob: z.string().optional(),
});

async function register(req, res) {
  try {
    const data = registerSchema.parse(req.body);

    const result = await registerUser(data);

    return res.status(201).json(result);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Invalid registration data",
        errors: error.issues,
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
async function login(req, res) {
  try {
    const data = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .parse(req.body);

    const result = await loginUser(data);

    return res.status(200).json(result);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Invalid login data",
        errors: error.issues,
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

module.exports = {
  register,
  login,
};