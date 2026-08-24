const express = require("express");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const bookingController =
  require("../controllers/booking.controller");

const {
  createHoldSchema,
} = require("../validators/booking.validators");

const router = express.Router();

router.use(authenticate);
router.use(authorize("PATIENT"));

router.post(
  "/hold",
  validate(createHoldSchema),
  bookingController.createHold
);

router.post(
  "/:appointmentId/confirm",
  bookingController.confirmAppointment
);

router.post(
  "/:appointmentId/cancel",
  bookingController.cancelAppointment
);

router.get(
  "/my",
  bookingController.getMyAppointments
);

module.exports = router;