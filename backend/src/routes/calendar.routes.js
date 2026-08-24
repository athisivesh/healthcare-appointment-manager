const express = require("express");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const calendarController =
  require("../controllers/calendar.controller");

const router = express.Router();

router.use(authenticate);
router.use(authorize("PATIENT"));

router.post(
  "/process",
  calendarController.processPending
);

module.exports = router;