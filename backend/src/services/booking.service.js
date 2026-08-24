const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const notificationService = require("./notification.service");
const calendarService =
  require("./calendar.service");

const HOLD_DURATION_MINUTES = 5;

function getSlotEnd(slotStart, durationMinutes) {
  return new Date(
    slotStart.getTime() + durationMinutes * 60 * 1000
  );
}

async function cleanupExpiredHold(doctorId, slotStart) {
  const expiredHold = await prisma.appointment.findFirst({
    where: {
      doctorId,
      slotStart,
      status: "HELD",
      holdExpiresAt: {
        lte: new Date(),
      },
    },
  });

  if (expiredHold) {
    await prisma.appointment.update({
      where: {
        id: expiredHold.id,
      },
      data: {
        status: "CANCELLED",
        holdExpiresAt: null,
      },
    });
  }
}

async function createHold(userId, { doctorId, slotStart }) {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new ApiError(
      404,
      "Patient profile not found"
    );
  }

  const patientId = patient.id;

  const start = new Date(slotStart);

  if (Number.isNaN(start.getTime())) {
    throw new ApiError(400, "Invalid slotStart");
  }

  if (start <= new Date()) {
    throw new ApiError(
      400,
      "Cannot book a slot in the past"
    );
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
  });

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  await cleanupExpiredHold(doctorId, start);

  const weekday = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ][start.getUTCDay()];

  const time = start.toISOString().slice(11, 16);

  const workingHours =
    await prisma.doctorWorkingHours.findFirst({
      where: {
        doctorId,
        weekday,
        startTime: {
          lte: time,
        },
        endTime: {
          gt: time,
        },
      },
    });

  if (!workingHours) {
    throw new ApiError(
      400,
      "Selected time is outside doctor's working hours"
    );
  }

  const leave = await prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      leaveDate: new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate()
        )
      ),
    },
  });

  if (leave) {
    throw new ApiError(
      400,
      "Doctor is on leave on the selected date"
    );
  }

  const slotEnd = getSlotEnd(
    start,
    doctor.slotDurationMinutes
  );

  const holdExpiresAt = new Date(
    Date.now() +
      HOLD_DURATION_MINUTES * 60 * 1000
  );

  try {
    const appointment =
      await prisma.appointment.create({
        data: {
          doctorId,
          patientId,
          slotStart: start,
          slotEnd,
          status: "HELD",
          holdExpiresAt,
        },
        include: {
          doctor: true,
        },
      });

    return appointment;
  } catch (error) {
    if (error?.code === "P2002") {
      throw new ApiError(
        409,
        "This slot is no longer available"
      );
    }

    throw error;
  }
}

async function confirmAppointment(
  userId,
  appointmentId
) {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new ApiError(
      404,
      "Patient profile not found"
    );
  }

  const patientId = patient.id;

  const appointment =
    await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

  if (!appointment) {
    throw new ApiError(
      404,
      "Appointment not found"
    );
  }

  if (appointment.patientId !== patientId) {
    throw new ApiError(
      403,
      "You do not have permission to confirm this appointment"
    );
  }

  if (appointment.status !== "HELD") {
    throw new ApiError(
      400,
      "Only HELD appointments can be confirmed"
    );
  }

  if (
    appointment.holdExpiresAt &&
    appointment.holdExpiresAt <= new Date()
  ) {
    await prisma.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: "CANCELLED",
        holdExpiresAt: null,
      },
    });

    throw new ApiError(
      409,
      "The appointment hold has expired"
    );
  }

  const confirmedAppointment =
  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: "CONFIRMED",
      holdExpiresAt: null,
    },
  });

await notificationService.createBookingConfirmation(
  confirmedAppointment.id
);

await calendarService.createCalendarEvent(
  confirmedAppointment.id
);

return confirmedAppointment;
}

async function cancelAppointment(
  userId,
  appointmentId
) {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new ApiError(
      404,
      "Patient profile not found"
    );
  }

  const patientId = patient.id;

  const appointment =
    await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

  if (!appointment) {
    throw new ApiError(
      404,
      "Appointment not found"
    );
  }

  if (appointment.patientId !== patientId) {
    throw new ApiError(
      403,
      "You do not have permission to cancel this appointment"
    );
  }

  if (
    appointment.status !== "HELD" &&
    appointment.status !== "CONFIRMED"
  ) {
    throw new ApiError(
      400,
      "This appointment cannot be cancelled"
    );
  }

  const cancelledAppointment =
    await prisma.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: "CANCELLED",
        holdExpiresAt: null,
      },
    });

  await notificationService.createCancellationNotification(
    cancelledAppointment.id
  );
  await calendarService.deleteCalendarEvent(
  cancelledAppointment.id
);

  return cancelledAppointment;
}

async function getPatientAppointments(userId) {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new ApiError(
      404,
      "Patient profile not found"
    );
  }

  return prisma.appointment.findMany({
    where: {
      patientId: patient.id,
    },
    include: {
      doctor: true,
    },
    orderBy: {
      slotStart: "asc",
    },
  });
}

module.exports = {
  createHold,
  confirmAppointment,
  cancelAppointment,
  getPatientAppointments,
};