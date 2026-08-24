const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");



function toMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

async function getDoctorById(doctorId) {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
  });

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  return doctor;
}

async function searchDoctors(specialisation) {
  return prisma.doctor.findMany({
    where: specialisation
      ? {
          specialisation: {
            equals: specialisation,
            mode: "insensitive",
          },
        }
      : undefined,
    select: {
      id: true,
      name: true,
      specialisation: true,
      slotDurationMinutes: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

async function addWorkingHours(doctorId, data) {
  await getDoctorById(doctorId);

  const existing = await prisma.doctorWorkingHours.findMany({
    where: {
      doctorId,
      weekday: data.weekday,
    },
  });

  const newStart = toMinutes(data.startTime);
  const newEnd = toMinutes(data.endTime);

  const overlaps = existing.some((record) => {
    const existingStart = toMinutes(record.startTime);
    const existingEnd = toMinutes(record.endTime);

    return newStart < existingEnd && newEnd > existingStart;
  });

  if (overlaps) {
    throw new ApiError(
      409,
      "Working hours overlap with an existing working-hours block"
    );
  }

  return prisma.doctorWorkingHours.create({
    data: {
      doctorId,
      weekday: data.weekday,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });
}

async function listWorkingHours(doctorId) {
  await getDoctorById(doctorId);

  return prisma.doctorWorkingHours.findMany({
    where: {
      doctorId,
    },
    orderBy: [
      {
        weekday: "asc",
      },
      {
        startTime: "asc",
      },
    ],
  });
}

async function deleteWorkingHours(doctorId, workingHoursId) {
  const record = await prisma.doctorWorkingHours.findUnique({
    where: {
      id: workingHoursId,
    },
  });

  if (!record || record.doctorId !== doctorId) {
    throw new ApiError(404, "Working hours record not found");
  }

  await prisma.doctorWorkingHours.delete({
    where: {
      id: workingHoursId,
    },
  });
}

async function addLeave(doctorId, { leaveDate, reason }) {
  await getDoctorById(doctorId);

  const date = new Date(`${leaveDate}T00:00:00.000Z`);

  const existing = await prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      leaveDate: date,
    },
  });

  if (existing) {
    throw new ApiError(409, "Doctor is already marked on leave for this date");
  }

  const leave = await prisma.doctorLeave.create({
    data: {
      doctorId,
      leaveDate: date,
      reason: reason || null,
    },
  });

  await handleLeaveConflicts(doctorId, leaveDate);

  return leave;
}

async function handleLeaveConflicts(doctorId, leaveDate) {
  const dayStart = new Date(`${leaveDate}T00:00:00.000Z`);
  const dayEnd = new Date(`${leaveDate}T23:59:59.999Z`);

  const affectedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      slotStart: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: {
        in: ["HELD", "CONFIRMED"],
      },
    },
  });

  for (const appointment of affectedAppointments) {
    await prisma.$transaction([
      prisma.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: "CANCELLED_DUE_TO_LEAVE",
        },
      }),

      prisma.notification.create({
        data: {
          appointmentId: appointment.id,
          type: "LEAVE_CONFLICT",
          status: "PENDING",
        },
      }),
    ]);
  }

  return affectedAppointments.length;
}

async function listLeave(doctorId) {
  await getDoctorById(doctorId);

  return prisma.doctorLeave.findMany({
    where: {
      doctorId,
    },
    orderBy: {
      leaveDate: "asc",
    },
  });
}

async function deleteLeave(doctorId, leaveId) {
  const record = await prisma.doctorLeave.findUnique({
    where: {
      id: leaveId,
    },
  });

  if (!record || record.doctorId !== doctorId) {
    throw new ApiError(404, "Leave record not found");
  }

  await prisma.doctorLeave.delete({
    where: {
      id: leaveId,
    },
  });
}

async function getAvailableSlots(doctorId, dateString) {
  const doctor = await getDoctorById(doctorId);

  const targetDate = new Date(`${dateString}T00:00:00.000Z`);

  if (Number.isNaN(targetDate.getTime())) {
    throw new ApiError(400, "Invalid date");
  }

  const WEEKDAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const weekday = WEEKDAY_NAMES[targetDate.getUTCDay()];

  const leave = await prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      leaveDate: targetDate,
    },
  });

  if (leave) {
    return {
      slots: [],
      slotDurationMinutes: doctor.slotDurationMinutes,
      reason: "Doctor is on leave on this date",
    };
  }

  const workingHours = await prisma.doctorWorkingHours.findMany({
    where: {
      doctorId,
      weekday,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (workingHours.length === 0) {
    return {
      slots: [],
      slotDurationMinutes: doctor.slotDurationMinutes,
      reason: "No working hours configured for this weekday",
    };
  }

  const dayStart = new Date(`${dateString}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateString}T23:59:59.999Z`);

  const activeAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      slotStart: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: {
        in: ["HELD", "CONFIRMED"],
      },
    },
    select: {
      slotStart: true,
    },
  });

  const takenSlots = new Set(
    activeAppointments.map((appointment) =>
      appointment.slotStart.toISOString()
    )
  );

  const duration = doctor.slotDurationMinutes;
  const slots = [];

  for (const block of workingHours) {
    let cursor = toMinutes(block.startTime);
    const end = toMinutes(block.endTime);

    while (cursor + duration <= end) {
      const slotStart = new Date(
        dayStart.getTime() + cursor * 60 * 1000
      );

      if (
        !takenSlots.has(slotStart.toISOString()) &&
        slotStart.getTime() > Date.now()
      ) {
        slots.push(slotStart.toISOString());
      }

      cursor += duration;
    }
  }

  return {
    slots,
    slotDurationMinutes: duration,
  };
}

module.exports = {
  searchDoctors,
  addWorkingHours,
  listWorkingHours,
  deleteWorkingHours,
  addLeave,
  listLeave,
  deleteLeave,
  getAvailableSlots,
  handleLeaveConflicts,
};