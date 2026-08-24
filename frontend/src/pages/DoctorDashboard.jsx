import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function DoctorDashboard() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [selected, setSelected] = useState(null);

  const [doctorNotes, setDoctorNotes] = useState("");
  const [prescriptionText, setPrescriptionText] = useState("");

  const [preSummary, setPreSummary] = useState(null);
  const [postSummary, setPostSummary] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAppointments = async () => {
    try {
      const response = await api.get(
        "/clinical/doctor/appointments"
      );

      setAppointments(response.data.appointments || []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load appointments"
      );
    }
  };

  const selectAppointment = async (appointment) => {
    setSelected(null);
    setPreSummary(null);
    setPostSummary(null);
    setDoctorNotes("");
    setPrescriptionText("");
    setError("");
    setMessage("");

    try {
      const response = await api.get(
        `/clinical/doctor/appointments/${appointment.id}`
      );

      const fullAppointment = response.data.appointment;

      setSelected(fullAppointment);

      if (fullAppointment.postVisitNotes) {
        setDoctorNotes(
          fullAppointment.postVisitNotes.doctorNotes || ""
        );

        setPrescriptionText(
          fullAppointment.postVisitNotes.prescriptionText || ""
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load appointment"
      );
    }
  };

  const loadPreVisitSummary = async () => {
    if (!selected) return;

    try {
      const response = await api.get(
        `/summaries/doctor/appointments/${selected.id}/pre-visit-summary`
      );

      setPreSummary(response.data.summary);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Pre-visit summary unavailable"
      );
    }
  };

  const saveNotes = async () => {
    if (!selected) return;

    setError("");
    setMessage("");

    try {
      await api.post(
        `/clinical/doctor/appointments/${selected.id}/post-visit-notes`,
        {
          doctorNotes,
          prescriptionText,
        }
      );

      setMessage("Post-visit notes saved.");

      await selectAppointment(selected);
      await loadAppointments();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to save notes"
      );
    }
  };

  const generatePostVisitSummary = async () => {
    if (!selected) return;

    setError("");

    try {
      const response = await api.post(
        `/summaries/doctor/appointments/${selected.id}/post-visit-summary`
      );

      setPostSummary(response.data.summary);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to generate post-visit summary"
      );
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
  }, []);

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1>Doctor Dashboard</h1>
          <p>Healthcare Appointment Manager</p>
        </div>

        <button onClick={logout}>Logout</button>
      </header>

      {message && (
        <div style={successStyle}>
          {message}
        </div>
      )}

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <section style={sectionStyle}>
        <h2>My Appointments</h2>

        {appointments.length === 0 && (
          <p>No appointments found.</p>
        )}

        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            style={cardStyle}
          >
            <h3>
              Patient:{" "}
              {appointment.patient?.name ||
                appointment.patient?.user?.name ||
                "Patient"}
            </h3>

            <p>
              Date:{" "}
              {new Date(
                appointment.slotStart
              ).toLocaleString()}
            </p>

            <p>
              Status:{" "}
              <strong>{appointment.status}</strong>
            </p>

            {appointment.symptomForm && (
              <p>
                <strong>Symptoms submitted</strong>
              </p>
            )}

            <button
              onClick={() =>
                selectAppointment(appointment)
              }
            >
              Open Appointment
            </button>
          </div>
        ))}
      </section>

      {selected && (
        <section style={sectionStyle}>
          <h2>Patient Consultation</h2>

          <p>
            <strong>Appointment:</strong>{" "}
            {selected.id}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {new Date(
              selected.slotStart
            ).toLocaleString()}
          </p>

          <hr />

          <h3>Patient Symptoms</h3>

          {selected.symptomForm ? (
            <div style={infoStyle}>
              {selected.symptomForm.symptomsText}
            </div>
          ) : (
            <p>No symptoms submitted.</p>
          )}

          <hr />

          <h3>Pre-Visit Summary</h3>

          <button onClick={loadPreVisitSummary}>
            View Pre-Visit Summary
          </button>

          {preSummary && (
            <div style={infoStyle}>
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
                    <li key={index}>
                      {question}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          <hr />

          <h3>Post-Visit Notes</h3>

          <label>
            Doctor Notes
          </label>

          <textarea
            rows="6"
            value={doctorNotes}
            onChange={(e) =>
              setDoctorNotes(e.target.value)
            }
            placeholder="Enter consultation notes..."
            style={textareaStyle}
          />

          <label>
            Prescription
          </label>

          <textarea
            rows="4"
            value={prescriptionText}
            onChange={(e) =>
              setPrescriptionText(e.target.value)
            }
            placeholder="Enter prescription..."
            style={textareaStyle}
          />

          <button onClick={saveNotes}>
            Save Post-Visit Notes
          </button>

          <hr />

          <h3>Post-Visit Summary</h3>

          <button
            onClick={generatePostVisitSummary}
          >
            Generate Post-Visit Summary
          </button>

          {postSummary && (
            <div style={infoStyle}>
              <p>
                <strong>Patient-friendly summary:</strong>
              </p>

              <p>
                {postSummary.patientFriendlyText}
              </p>

              <p>
                <strong>Medication:</strong>
              </p>

              <p>
                {
                  postSummary.medicationSchedule
                    ?.prescription
                }
              </p>

              <p>
                {
                  postSummary.medicationSchedule
                    ?.instructions
                }
              </p>

              <p>
                <strong>Follow-up:</strong>
              </p>

              <p>
                {postSummary.followUpSteps}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

const pageStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "30px",
  fontFamily: "Arial, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px",
};

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
  marginBottom: "12px",
};

const infoStyle = {
  background: "#f5f5f5",
  padding: "15px",
  margin: "15px 0",
  borderRadius: "6px",
};

const textareaStyle = {
  display: "block",
  width: "100%",
  maxWidth: "700px",
  marginTop: "8px",
  marginBottom: "15px",
  padding: "10px",
};

const successStyle = {
  background: "#e8f5e9",
  padding: "12px",
  marginBottom: "15px",
};

const errorStyle = {
  background: "#ffebee",
  color: "#b71c1c",
  padding: "12px",
  marginBottom: "15px",
};

export default DoctorDashboard;