const express = require("express");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const availabilityController = require("../controllers/availability.controller");

const {
  workingHoursSchema,
  leaveSchema,
  slotsQuerySchema,
  doctorSearchQuerySchema,
} = require("../validators/availability.validators");

const router = express.Router();

/*
 * Public doctor search.
 */
router.get(
  "/doctors",
  validate(doctorSearchQuerySchema, "query"),
  availabilityController.searchDoctors
);

/*
 * Public available-slot lookup.
 */
router.get(
  "/doctors/:doctorId/slots",
  validate(slotsQuerySchema, "query"),
  availabilityController.getSlots
);

/*
 * Admin manages doctor availability.
 */
router.use(authenticate);
router.use(authorize("ADMIN"));

router.post(
  "/doctors/:doctorId/working-hours",
  validate(workingHoursSchema),
  availabilityController.addWorkingHours
);

router.get(
  "/doctors/:doctorId/working-hours",
  availabilityController.listWorkingHours
);

router.delete(
  "/doctors/:doctorId/working-hours/:id",
  availabilityController.deleteWorkingHours
);

router.post(
  "/doctors/:doctorId/leave",
  validate(leaveSchema),
  availabilityController.addLeave
);

router.get(
  "/doctors/:doctorId/leave",
  availabilityController.listLeave
);

router.delete(
  "/doctors/:doctorId/leave/:id",
  availabilityController.deleteLeave
);

module.exports = router;