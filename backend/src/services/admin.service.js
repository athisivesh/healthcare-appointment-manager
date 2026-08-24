const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const passwordService = require("./password.service");

async function createDoctor({
  email,
  password,
  name,
  specialisation,
  slotDurationMinutes,
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const passwordHash = await passwordService.hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "DOCTOR",
      },
    });

    const doctor = await tx.doctor.create({
      data: {
        userId: user.id,
        name,
        specialisation,
        slotDurationMinutes,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      doctor,
    };
  });

  return result;
}

async function listDoctors() {
  return prisma.doctor.findMany({
    select: {
      id: true,
      userId: true,
      name: true,
      specialisation: true,
      slotDurationMinutes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

async function updateDoctor(doctorId, data) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  return prisma.doctor.update({
    where: { id: doctorId },
    data,
    select: {
      id: true,
      userId: true,
      name: true,
      specialisation: true,
      slotDurationMinutes: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

module.exports = {
  createDoctor,
  listDoctors,
  updateDoctor,
};