const asyncHandler = require("../utils/asyncHandler");
const calendarService = require("../services/calendar.service");

const processPending =
  asyncHandler(async (req, res) => {
    const events =
      await calendarService.processPendingCalendarEvents();

    res.json({
      events,
    });
  });

module.exports = {
  processPending,
};