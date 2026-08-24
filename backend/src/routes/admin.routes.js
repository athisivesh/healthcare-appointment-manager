const express = require("express");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const adminController = require("../controllers/admin.controller");

const {
  createDoctorSchema,
  updateDoctorSchema,
} = require("../validators/admin.validators");

const router = express.Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.post(
  "/doctors",
  validate(createDoctorSchema),
  adminController.createDoctor
);

router.get(
  "/doctors",
  adminController.listDoctors
);

router.patch(
  "/doctors/:doctorId",
  validate(updateDoctorSchema),
  adminController.updateDoctor
);

module.exports = router;