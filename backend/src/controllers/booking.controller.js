const asyncHandler = require("../utils/asyncHandler");
const bookingService = require("../services/booking.service");

const createHold = asyncHandler(async (req, res) => {
  const appointment = await bookingService.createHold(
    req.user.id,
    req.body
  );

  res.status(201).json({
    appointment,
  });
});

const confirmAppointment = asyncHandler(async (req, res) => {
  const appointment =
    await bookingService.confirmAppointment(
      req.user.id,
      req.params.appointmentId
    );

  res.json({
    appointment,
  });
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment =
    await bookingService.cancelAppointment(
      req.user.id,
      req.params.appointmentId
    );

  res.json({
    appointment,
  });
});

const getMyAppointments = asyncHandler(async (req, res) => {
  const appointments =
    await bookingService.getPatientAppointments(
      req.user.id
    );

  res.json({
    appointments,
  });
});

module.exports = {
  createHold,
  confirmAppointment,
  cancelAppointment,
  getMyAppointments,
};