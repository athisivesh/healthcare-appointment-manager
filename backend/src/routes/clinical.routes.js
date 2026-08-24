const express = require("express");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const clinicalController =
  require("../controllers/clinical.controller");

const {
  symptomFormSchema,
  appointmentIdParamSchema,
  postVisitNotesSchema,
} = require("../validators/clinical.validators");

const router = express.Router();

router.use(authenticate);

/*
 * PATIENT
 */

router.post(
  "/patient/appointments/:appointmentId/symptoms",
  authorize("PATIENT"),
  validate(appointmentIdParamSchema, "params"),
  validate(symptomFormSchema),
  clinicalController.submitSymptoms
);

router.get(
  "/patient/appointments/:appointmentId/symptoms",
  authorize("PATIENT"),
  validate(appointmentIdParamSchema, "params"),
  clinicalController.getPatientSymptoms
);

router.get(
  "/patient/appointments/:appointmentId/post-visit-notes",
  authorize("PATIENT"),
  validate(appointmentIdParamSchema, "params"),
  clinicalController.getPatientPostVisitNotes
);

/*
 * DOCTOR
 */

router.get(
  "/doctor/appointments",
  authorize("DOCTOR"),
  clinicalController.getDoctorAppointments
);

router.get(
  "/doctor/appointments/:appointmentId",
  authorize("DOCTOR"),
  validate(appointmentIdParamSchema, "params"),
  clinicalController.getDoctorAppointment
);

router.post(
  "/doctor/appointments/:appointmentId/post-visit-notes",
  authorize("DOCTOR"),
  validate(appointmentIdParamSchema, "params"),
  validate(postVisitNotesSchema),
  clinicalController.savePostVisitNotes
);

module.exports = router;