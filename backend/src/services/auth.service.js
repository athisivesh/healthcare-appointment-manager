const prisma = require("../config/prisma");
const { hashPassword, comparePassword } = require("./password.service");
const { generateToken } = require("./jwt.service");

async function registerUser({
  email,
  password,
  role,
  name,
  phone,
  dob,
}) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        role,
      },
    });

    if (role === "PATIENT") {
      await tx.patient.create({
        data: {
          userId: newUser.id,
          name,
          phone: phone || null,
          dob: dob ? new Date(dob) : null,
        },
      });
    }

    return newUser;
  });

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token,
  };
}
async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordValid = await comparePassword(password, user.passwordHash);

  if (!passwordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token,
  };
}


module.exports = {
  registerUser,
  loginUser,
};