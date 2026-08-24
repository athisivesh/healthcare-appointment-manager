const express = require("express");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const notificationController =
  require("../controllers/notification.controller");

const router = express.Router();

router.use(authenticate);
router.use(authorize("PATIENT"));

router.get(
  "/my",
  notificationController.getMyNotifications
);

router.post(
  "/:notificationId/read",
  notificationController.markSent
);

router.post(
  "/process",
  notificationController.processPending
);

router.post(
  "/reminders/process",
  notificationController.createReminders
);

module.exports = router;