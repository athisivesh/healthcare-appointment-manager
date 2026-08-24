const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const errorHandler = require("./middleware/errorHandler");
const protectedTestRoutes = require("./routes/protected-test.routes");
const adminRoutes = require("./routes/admin.routes");
const availabilityRoutes = require("./routes/availability.routes");
const bookingRoutes = require("./routes/booking.routes");
const summaryRoutes = require("./routes/summary.routes");
const notificationRoutes =
  require("./routes/notification.routes");
const calendarRoutes =
  require("./routes/calendar.routes");

const clinicalRoutes = require("./routes/clinical.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Healthcare Appointment Manager API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/clinical", clinicalRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/protected", protectedTestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/summaries", summaryRoutes);
app.use(
  "/api/notifications",
  notificationRoutes
);
app.use(
  "/api/calendar",
  calendarRoutes
);



app.use(errorHandler);

module.exports = app;