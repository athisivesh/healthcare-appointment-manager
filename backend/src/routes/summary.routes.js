const express = require("express");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const summaryController =
  require("../controllers/summary.controller");

const {
  appointmentIdParamSchema,
} = require("../validators/summary.validators");

const router = express.Router();

router.use(authenticate);

// --------------------
// PRE-VISIT SUMMARY
// --------------------

router.post(
  "/patient/appointments/:appointmentId/pre-visit-summary",
  authorize("PATIENT"),
  validate(appointmentIdParamSchema, "params"),
  summaryController.generatePreVisitSummary
);

router.get(
  "/patient/appointments/:appointmentId/pre-visit-summary",
  authorize("PATIENT"),
  validate(appointmentIdParamSchema, "params"),
  summaryController.getPatientPreVisitSummary
);

router.get(
  "/doctor/appointments/:appointmentId/pre-visit-summary",
  authorize("DOCTOR"),
  validate(appointmentIdParamSchema, "params"),
  summaryController.getDoctorPreVisitSummary
);

// --------------------
// POST-VISIT SUMMARY
// --------------------

router.post(
  "/doctor/appointments/:appointmentId/post-visit-summary",
  authorize("DOCTOR"),
  validate(appointmentIdParamSchema, "params"),
  summaryController.generatePostVisitSummary
);

router.get(
  "/doctor/appointments/:appointmentId/post-visit-summary",
  authorize("DOCTOR"),
  validate(appointmentIdParamSchema, "params"),
  summaryController.getDoctorPostVisitSummary
);

router.get(
  "/patient/appointments/:appointmentId/post-visit-summary",
  authorize("PATIENT"),
  validate(appointmentIdParamSchema, "params"),
  summaryController.getPatientPostVisitSummary
);

module.exports = router;