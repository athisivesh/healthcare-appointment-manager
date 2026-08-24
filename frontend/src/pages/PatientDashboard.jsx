import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function PatientDashboard() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [symptoms, setSymptoms] = useState("");

  const [preSummary, setPreSummary] = useState(null);
  const [postSummary, setPostSummary] = useState(null);

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const loadAppointments = async () => {
    try {
      const response = await api.get("/bookings/my");
      setAppointments(response.data.appointments || []);
    } catch (err) {
      setError(
        err.response?.data?.error || "Unable to load appointments"
      );
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await api.get("/notifications/my");
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error(err);
    }
  };

  const searchDoctors = async () => {
    clearMessages();

    try {
      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get("/availability/doctors", {
        params,
      });

      setDoctors(response.data.doctors || []);
    } catch (err) {
      setError(
        err.response?.data?.error || "Unable to search doctors"
      );
    }
  };

  const loadSlots = async (doctor) => {
    clearMessages();

    setSelectedDoctor(doctor);
    setSlots([]);

    if (!date) {
      setError("Select a date first");
      return;
    }

    try {
      const response = await api.get(
        `/availability/doctors/${doctor.id}/slots`,
        {
          params: {
            date,
          },
        }
      );

      setSlots(response.data.slots || []);
    } catch (err) {
      setError(
        err.response?.data?.error || "Unable to load available slots"
      );
    }
  };

  const holdAppointment = async (slotStart) => {
    clearMessages();

    try {
      const response = await api.post("/bookings/hold", {
        doctorId: selectedDoctor.id,
        slotStart,
      });

      const appointment = response.data.appointment;

      await api.post(`/bookings/${appointment.id}/confirm`);

      setMessage("Appointment booked successfully.");

      await loadAppointments();
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.error || "Unable to book appointment"
      );
    }
  };

  const submitSymptoms = async () => {
    if (!selectedAppointment || !symptoms.trim()) {
      setError("Select an appointment and enter your symptoms.");
      return;
    }

    clearMessages();

    try {
      await api.post(
        `/clinical/patient/appointments/${selectedAppointment.id}/symptoms`,
        {
          symptomsText: symptoms,
        }
      );

      setMessage("Symptoms submitted successfully.");
      setSymptoms("");
    } catch (err) {
      setError(
        err.response?.data?.error || "Unable to submit symptoms"
      );
    }
  };

  const generatePreVisitSummary = async () => {
    if (!selectedAppointment) {
      setError("Select an appointment first.");
      return;
    }

    clearMessages();

    try {
      const response = await api.post(
        `/summaries/patient/appointments/${selectedAppointment.id}/pre-visit-summary`
      );

      setPreSummary(response.data.summary);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to generate pre-visit summary"
      );
    }
  };

  const loadPostVisitSummary = async () => {
    if (!selectedAppointment) {
      setError("Select an appointment first.");
      return;
    }

    clearMessages();

    try {
      const response = await api.get(
        `/summaries/patient/appointments/${selectedAppointment.id}/post-visit-summary`
      );

      setPostSummary(response.data.summary);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Post-visit summary is not available"
      );
    }
  };

  const cancelAppointment = async (appointmentId) => {
    clearMessages();

    try {
      await api.post(`/bookings/${appointmentId}/cancel`);

      setMessage("Appointment cancelled.");

      await loadAppointments();
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to cancel appointment"
      );
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      await loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    loadAppointments();
    loadNotifications();
    searchDoctors();
  }, []);

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1>Patient Dashboard</h1>
          <p>Healthcare Appointment Manager</p>
        </div>

        <button onClick={logout}>Logout</button>
      </div>

      {message && (
        <div
          style={{
            padding: "12px",
            background: "#e8f5e9",
            marginBottom: "15px",
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px",
            background: "#ffebee",
            color: "#b71c1c",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      {/* BOOK APPOINTMENT */}

      <section style={sectionStyle}>
        <h2>Book an Appointment</h2>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            placeholder="Search doctor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <button onClick={searchDoctors}>Search</button>
        </div>

        {doctors.map((doctor) => (
          <div key={doctor.id} style={cardStyle}>
            <strong>
              {doctor.user?.name || doctor.name || "Doctor"}
            </strong>

            <p>
              {doctor.specialization ||
                doctor.specialty ||
                "Medical Doctor"}
            </p>

            <button onClick={() => loadSlots(doctor)}>
              View Slots
            </button>
          </div>
        ))}

        {selectedDoctor && (
          <div style={{ marginTop: "20px" }}>
            <h3>
              Available slots for{" "}
              {selectedDoctor.user?.name ||
                selectedDoctor.name ||
                "Doctor"}
            </h3>

            {slots.length === 0 && (
              <p>No available slots found.</p>
            )}

            {slots.map((slot, index) => {
              const slotStart =
                slot.slotStart ||
                slot.start ||
                slot.startTime ||
                slot;

              return (
                <button
                  key={index}
                  onClick={() => holdAppointment(slotStart)}
                  style={{
                    margin: "5px",
                    padding: "10px",
                  }}
                >
                  {new Date(slotStart).toLocaleString()}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* APPOINTMENTS */}

      <section style={sectionStyle}>
        <h2>My Appointments</h2>

        {appointments.length === 0 && (
          <p>No appointments found.</p>
        )}

        {appointments.map((appointment) => (
          <div key={appointment.id} style={cardStyle}>
            <h3>
              {appointment.doctor?.user?.name ||
  appointment.doctor?.name ||
  "Doctor"}
            </h3>

            <p>
              Date:{" "}
              {new Date(
                appointment.slotStart
              ).toLocaleString()}
            </p>

            <p>
              Status: <strong>{appointment.status}</strong>
            </p>

            <button
              onClick={() => {
                setSelectedAppointment(appointment);
                setPreSummary(null);
                setPostSummary(null);
              }}
            >
              Select
            </button>

            {(appointment.status === "HELD" ||
              appointment.status === "CONFIRMED") && (
              <button
                onClick={() =>
                  cancelAppointment(appointment.id)
                }
                style={{ marginLeft: "10px" }}
              >
                Cancel
              </button>
            )}
          </div>
        ))}
      </section>

      {/* CLINICAL */}

      {selectedAppointment && (
        <section style={sectionStyle}>
          <h2>Appointment Details</h2>

          <p>
            Selected appointment:
            <strong> {selectedAppointment.id}</strong>
          </p>

          <h3>Symptoms</h3>

          <textarea
            rows="5"
            style={{
              width: "100%",
              maxWidth: "700px",
              display: "block",
              marginBottom: "10px",
            }}
            placeholder="Describe your symptoms..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />

          <button onClick={submitSymptoms}>
            Submit Symptoms
          </button>

          <hr style={{ margin: "25px 0" }} />

          <h3>Pre-Visit Summary</h3>

          <button onClick={generatePreVisitSummary}>
            Generate Pre-Visit Summary
          </button>

          {preSummary && (
            <div style={cardStyle}>
              <p>
                <strong>Urgency:</strong>{" "}
                {preSummary.urgency}
              </p>

              <p>
                <strong>Chief Complaint:</strong>{" "}
                {preSummary.chiefComplaint}
              </p>

              <h4>Suggested Questions</h4>

              <ul>
                {(preSummary.suggestedQuestions || []).map(
                  (question, index) => (
                    <li key={index}>{question}</li>
                  )
                )}
              </ul>
            </div>
          )}

          <hr style={{ margin: "25px 0" }} />

          <h3>Post-Visit Summary</h3>

          <button onClick={loadPostVisitSummary}>
            View Post-Visit Summary
          </button>

          {postSummary && (
            <div style={cardStyle}>
              <p>
                <strong>Doctor's Summary:</strong>
              </p>

              <p>{postSummary.patientFriendlyText}</p>

              <h4>Medication</h4>

              <p>
                {postSummary.medicationSchedule?.prescription}
              </p>

              <p>
                {postSummary.medicationSchedule?.instructions}
              </p>

              <h4>Follow-up</h4>

              <p>{postSummary.followUpSteps}</p>
            </div>
          )}
        </section>
      )}

      {/* NOTIFICATIONS */}

      <section style={sectionStyle}>
        <h2>Notifications</h2>

        {notifications.length === 0 && (
          <p>No notifications.</p>
        )}

        {notifications.map((notification) => (
          <div key={notification.id} style={cardStyle}>
            <strong>{notification.type}</strong>

            <p>
              Status: {notification.status}
            </p>

            <p>
              Appointment:{" "}
              {notification.appointment?.slotStart
                ? new Date(
                    notification.appointment.slotStart
                  ).toLocaleString()
                : notification.appointmentId}
            </p>

            {notification.status === "PENDING" && (
              <button
                onClick={() =>
                  markNotificationRead(notification.id)
                }
              >
                Mark as Read
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

const sectionStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "25px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "6px",
  padding: "15px",
  marginBottom: "10px",
};

export default PatientDashboard;