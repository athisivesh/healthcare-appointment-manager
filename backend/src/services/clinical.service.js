const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");

async function getPatientProfile(userId) {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new ApiError(404, "Patient profile not found");
  }

  return patient;
}

async function getDoctorProfile(userId) {
  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor) {
    throw new ApiError(404, "Doctor profile not found");
  }

  return doctor;
}

async function getAppointmentForPatient(userId, appointmentId) {
  const patient = await getPatientProfile(userId);

  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: true,
      symptomForm: true,
      preVisitSummary: true,
      postVisitNotes: true,
      postVisitSummary: true,
    },
  });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.patientId !== patient.id) {
    throw new ApiError(
      403,
      "You do not have permission to access this appointment"
    );
  }

  return appointment;
}

async function getAppointmentForDoctor(userId, appointmentId) {
  const doctor = await getDoctorProfile(userId);

  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: true,
      patient: true,
      symptomForm: true,
      preVisitSummary: true,
      postVisitNotes: true,
      postVisitSummary: true,
    },
  });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.doctorId !== doctor.id) {
    throw new ApiError(
      403,
      "You do not have permission to access this appointment"
    );
  }

  return appointment;
}

async function submitSymptoms(userId, appointmentId, symptomsText) {
  const appointment = await getAppointmentForPatient(
    userId,
    appointmentId
  );

  if (appointment.status !== "CONFIRMED") {
    throw new ApiError(
      400,
      "Symptoms can only be submitted for a confirmed appointment"
    );
  }

  const symptomForm = await prisma.symptomForm.upsert({
    where: {
      appointmentId,
    },
    update: {
      symptomsText,
      submittedAt: new Date(),
    },
    create: {
      appointmentId,
      symptomsText,
    },
  });

  return symptomForm;
}

async function getPatientSymptoms(userId, appointmentId) {
  const appointment = await getAppointmentForPatient(
    userId,
    appointmentId
  );

  if (!appointment.symptomForm) {
    throw new ApiError(
      404,
      "Symptom form has not been submitted"
    );
  }

  return appointment.symptomForm;
}

async function getDoctorAppointment(userId, appointmentId) {
  return getAppointmentForDoctor(userId, appointmentId);
}

async function savePostVisitNotes(
  userId,
  appointmentId,
  doctorNotes,
  prescriptionText
) {
  const appointment = await getAppointmentForDoctor(
    userId,
    appointmentId
  );

  if (appointment.status !== "CONFIRMED") {
    throw new ApiError(
      400,
      "Consultation notes can only be added to a confirmed appointment"
    );
  }

  const notes = await prisma.postVisitNotes.upsert({
    where: {
      appointmentId,
    },
    update: {
      doctorNotes,
      prescriptionText:
        prescriptionText || null,
    },
    create: {
      appointmentId,
      doctorNotes,
      prescriptionText:
        prescriptionText || null,
    },
  });

  return notes;
}

async function getPatientPostVisitNotes(
  userId,
  appointmentId
) {
  const appointment = await getAppointmentForPatient(
    userId,
    appointmentId
  );

  if (!appointment.postVisitNotes) {
    throw new ApiError(
      404,
      "Post-visit notes are not available"
    );
  }

  return appointment.postVisitNotes;
}

async function getDoctorAppointments(userId) {
  const doctor = await getDoctorProfile(userId);

  return prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
    },
    include: {
      patient: true,
      symptomForm: true,
      preVisitSummary: true,
      postVisitNotes: true,
      postVisitSummary: true,
    },
    orderBy: {
      slotStart: "asc",
    },
  });
}

module.exports = {
  submitSymptoms,
  getPatientSymptoms,
  getDoctorAppointment,
  getDoctorAppointments,
  savePostVisitNotes,
  getPatientPostVisitNotes,
};