const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.get(
  "/patient-only",
  authenticate,
  authorize("PATIENT"),
  (req, res) => {
    res.json({
      message: "You are authenticated as a PATIENT",
      userId: req.user.id,
    });
  }
);

router.get(
  "/doctor-only",
  authenticate,
  authorize("DOCTOR"),
  (req, res) => {
    res.json({
      message: "You are authenticated as a DOCTOR",
      userId: req.user.id,
    });
  }
);

router.get(
  "/admin-only",
  authenticate,
  authorize("ADMIN"),
  (req, res) => {
    res.json({
      message: "You are authenticated as an ADMIN",
      userId: req.user.id,
    });
  }
);

module.exports = router;