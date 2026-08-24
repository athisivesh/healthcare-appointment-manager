const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");

async function createCalendarEvent(appointmentId) {
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

  if (appointment.status !== "CONFIRMED") {
    throw new ApiError(
      400,
      "Only confirmed appointments can be added to the calendar"
    );
  }

  const existing =
    await prisma.calendarEvent.findUnique({
      where: {
        appointmentId,
      },
    });

  if (existing) {
    return existing;
  }

  return prisma.calendarEvent.create({
    data: {
      appointmentId,
      doctorId: appointment.doctorId,
      syncStatus: "PENDING",
    },
  });
}

async function processCalendarEvent(
  calendarEventId
) {
  const calendarEvent =
    await prisma.calendarEvent.findUnique({
      where: {
        id: calendarEventId,
      },
      include: {
        appointment: true,
      },
    });

  if (!calendarEvent) {
    throw new ApiError(
      404,
      "Calendar event not found"
    );
  }

  if (calendarEvent.syncStatus === "SYNCED") {
    return calendarEvent;
  }

  /*
   * Local calendar sync simulation.
   *
   * Later this is where Google Calendar API
   * integration will be added.
   */
  const simulatedGoogleEventId =
    `local-${calendarEvent.appointmentId}`;

  return prisma.calendarEvent.update({
    where: {
      id: calendarEvent.id,
    },
    data: {
      googleEventId: simulatedGoogleEventId,
      syncStatus: "SYNCED",
    },
  });
}

async function processPendingCalendarEvents() {
  const events =
    await prisma.calendarEvent.findMany({
      where: {
        syncStatus: "PENDING",
      },
    });

  const results = [];

  for (const event of events) {
    const result =
      await processCalendarEvent(event.id);

    results.push(result);
  }

  return results;
}

async function deleteCalendarEvent(
  appointmentId
) {
  const calendarEvent =
    await prisma.calendarEvent.findUnique({
      where: {
        appointmentId,
      },
    });

  if (!calendarEvent) {
    return null;
  }

  return prisma.calendarEvent.update({
    where: {
      id: calendarEvent.id,
    },
    data: {
      syncStatus: "DELETED",
    },
  });
}

module.exports = {
  createCalendarEvent,
  processCalendarEvent,
  processPendingCalendarEvents,
  deleteCalendarEvent,
};