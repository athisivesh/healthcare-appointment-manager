import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import DoctorDashboard from "./pages/DoctorDashboard";

function Home() {
  return (
    <div>
      <h1>Healthcare Appointment Manager</h1>
      <Link to="/login">Login</Link>
    </div>
  );
}

function PatientDashboard() {
  return (
    <div>
      <h1>Patient Dashboard</h1>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/patient"
          element={<PatientDashboard />}
        />

        <Route
          path="/doctor"
          element={<DoctorDashboard />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;