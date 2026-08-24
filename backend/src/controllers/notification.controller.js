const asyncHandler = require("../utils/asyncHandler");
const notificationService =
  require("../services/notification.service");

const getMyNotifications =
  asyncHandler(async (req, res) => {
    const notifications =
      await notificationService.getPatientNotifications(
        req.user.id
      );

    res.json({
      notifications,
    });
  });

const markSent =
  asyncHandler(async (req, res) => {
    const notification =
      await notificationService.markNotificationSent(
        req.user.id,
        req.params.notificationId
      );

    res.json({
      notification,
    });
  });

const processPending =
  asyncHandler(async (req, res) => {
    const notifications =
      await notificationService.processPendingNotifications();

    res.json({
      notifications,
    });
  });

const createReminders =
  asyncHandler(async (req, res) => {
    const reminders =
      await notificationService.createAppointmentReminders();

    res.json({
      reminders,
    });
  });

module.exports = {
  getMyNotifications,
  markSent,
  processPending,
  createReminders,
};