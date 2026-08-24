const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");

const MAX_RETRIES = 3;

async function createNotification(
  appointmentId,
  type
) {
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

  return prisma.notification.create({
    data: {
      appointmentId,
      type,
      status: "PENDING",
    },
  });
}

async function getPatientNotifications(userId) {
  const patient =
    await prisma.patient.findUnique({
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

  return prisma.notification.findMany({
    where: {
      appointment: {
        patientId: patient.id,
      },
    },
    include: {
      appointment: {
        include: {
          doctor: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function markNotificationSent(
  userId,
  notificationId
) {
  const patient =
    await prisma.patient.findUnique({
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

  const notification =
    await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
      include: {
        appointment: true,
      },
    });

  if (!notification) {
    throw new ApiError(
      404,
      "Notification not found"
    );
  }

  if (
    notification.appointment.patientId !== patient.id
  ) {
    throw new ApiError(
      403,
      "You do not have permission to access this notification"
    );
  }

  return prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      status: "SENT",
      lastAttemptAt: new Date(),
      errorMessage: null,
    },
  });
}

/*
 * Simulated delivery layer.
 *
 * This is intentionally provider-independent.
 * Later this function can be replaced with email,
 * SMS, push notification, etc.
 */
async function deliverNotification(notification) {
  console.log(
    `[Notification] ${notification.type} for appointment ${notification.appointmentId}`
  );

  return true;
}

async function processNotification(
  notificationId
) {
  const notification =
    await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

  if (!notification) {
    throw new ApiError(
      404,
      "Notification not found"
    );
  }

  if (notification.status !== "PENDING") {
    return notification;
  }

  const lastAttemptAt = new Date();

  try {
    const delivered =
      await deliverNotification(notification);

    if (!delivered) {
      throw new Error(
        "Notification delivery failed"
      );
    }

    return prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        status: "SENT",
        lastAttemptAt,
        errorMessage: null,
      },
    });
  } catch (error) {
    const nextRetryCount =
      notification.retryCount + 1;

    return prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        status:
          nextRetryCount >= MAX_RETRIES
            ? "FAILED"
            : "PENDING",
        retryCount: nextRetryCount,
        lastAttemptAt,
        errorMessage: error.message,
      },
    });
  }
}

async function processPendingNotifications() {
  const notifications =
    await prisma.notification.findMany({
      where: {
        status: "PENDING",
        retryCount: {
          lt: MAX_RETRIES,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  const results = [];

  for (const notification of notifications) {
    const result =
      await processNotification(
        notification.id
      );

    results.push(result);
  }

  return results;
}

async function createBookingConfirmation(
  appointmentId
) {
  return createNotification(
    appointmentId,
    "BOOKING_CONFIRMATION"
  );
}

async function createCancellationNotification(
  appointmentId
) {
  return createNotification(
    appointmentId,
    "CANCELLATION"
  );
}

async function createAppointmentReminders() {
  const now = new Date();

  const reminderWindowEnd = new Date(
  now.getTime() + 24 * 60 * 60 * 1000
);

  const appointments =
    await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        slotStart: {
          gt: now,
          lte: reminderWindowEnd,
        },
        notifications: {
          none: {
            type: "REMINDER",
          },
        },
      },
    });

  const reminders = [];

  for (const appointment of appointments) {
    const reminder =
      await createNotification(
        appointment.id,
        "REMINDER"
      );

    reminders.push(reminder);
  }

  return reminders;
}

module.exports = {
  createNotification,
  createBookingConfirmation,
  createCancellationNotification,
  createAppointmentReminders,
  getPatientNotifications,
  markNotificationSent,
  processNotification,
  processPendingNotifications,
};