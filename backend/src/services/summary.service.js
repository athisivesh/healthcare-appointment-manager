const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");

function generateLocalPreVisitSummary(symptomsText) {
  const text = symptomsText.toLowerCase();

  let urgency = "LOW";

  const highUrgencyKeywords = [
    "chest pain",
    "difficulty breathing",
    "shortness of breath",
    "unconscious",
    "severe bleeding",
    "seizure",
  ];

  const mediumUrgencyKeywords = [
    "fever",
    "vomiting",
    "persistent pain",
    "severe headache",
    "dizziness",
    "infection",
  ];

  if (
    highUrgencyKeywords.some((keyword) =>
      text.includes(keyword)
    )
  ) {
    urgency = "HIGH";
  } else if (
    mediumUrgencyKeywords.some((keyword) =>
      text.includes(keyword)
    )
  ) {
    urgency = "MEDIUM";
  }

  const chiefComplaint =
    symptomsText.trim().length > 200
      ? `${symptomsText.trim().slice(0, 197)}...`
      : symptomsText.trim();

  const suggestedQuestions = [
    "When did the symptoms begin?",
    "Have the symptoms become better or worse?",
    "Have you taken any medication for these symptoms?",
    "Do you have any known allergies or existing medical conditions?",
  ];

  return {
    urgency,
    chiefComplaint,
    suggestedQuestions,
  };
}

/*
 * Provider-independent local post-visit summary generator.
 *
 * Later, this function can be replaced by an actual
 * AI/LLM provider without changing the API structure.
 */
function generateLocalPostVisitSummary(
  doctorNotes,
  prescriptionText
) {
  const notes = doctorNotes.trim();

  const prescription = prescriptionText
    ? prescriptionText.trim()
    : null;

  const patientFriendlyText =
    `Your doctor recorded the following after your visit: ${notes}`;

  const medicationSchedule = prescription
    ? {
        prescription: prescription,
        instructions:
          "Follow the prescription exactly as advised by your doctor.",
      }
    : null;

  const followUpSteps =
    "Follow the doctor's advice and seek medical review if your symptoms worsen or do not improve.";

  return {
    patientFriendlyText,
    medicationSchedule,
    followUpSteps,
  };
}

async function getPatient(userId) {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new ApiError(
      404,
      "Patient profile not found"
    );
  }

  return patient;
}

async function getDoctor(userId) {
  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor) {
    throw new ApiError(
      404,
      "Doctor profile not found"
    );
  }

  return doctor;
}

async function getAppointmentForPatient(
  userId,
  appointmentId
) {
  const patient = await getPatient(userId);

  const appointment =
    await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        symptomForm: true,
        preVisitSummary: true,
        postVisitNotes: true,
        postVisitSummary: true,
        doctor: true,
      },
    });

  if (!appointment) {
    throw new ApiError(
      404,
      "Appointment not found"
    );
  }

  if (appointment.patientId !== patient.id) {
    throw new ApiError(
      403,
      "You do not have permission to access this appointment"
    );
  }

  return appointment;
}

async function getAppointmentForDoctor(
  userId,
  appointmentId
) {
  const doctor = await getDoctor(userId);

  const appointment =
    await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        symptomForm: true,
        preVisitSummary: true,
        postVisitNotes: true,
        postVisitSummary: true,
        patient: true,
        doctor: true,
      },
    });

  if (!appointment) {
    throw new ApiError(
      404,
      "Appointment not found"
    );
  }

  if (appointment.doctorId !== doctor.id) {
    throw new ApiError(
      403,
      "You do not have permission to access this appointment"
    );
  }

  return appointment;
}

async function generatePreVisitSummary(
  userId,
  appointmentId
) {
  const appointment =
    await getAppointmentForPatient(
      userId,
      appointmentId
    );

  if (!appointment.symptomForm) {
    throw new ApiError(
      400,
      "Patient must submit symptoms before generating a pre-visit summary"
    );
  }

  const result = generateLocalPreVisitSummary(
    appointment.symptomForm.symptomsText
  );

  const summary =
    await prisma.preVisitSummary.upsert({
      where: {
        appointmentId,
      },
      update: {
        urgency: result.urgency,
        chiefComplaint: result.chiefComplaint,
        suggestedQuestions:
          result.suggestedQuestions,
        rawLlmResponse: null,
        status: "SUCCESS",
      },
      create: {
        appointmentId,
        urgency: result.urgency,
        chiefComplaint: result.chiefComplaint,
        suggestedQuestions:
          result.suggestedQuestions,
        rawLlmResponse: null,
        status: "SUCCESS",
      },
    });

  return summary;
}

async function getPatientPreVisitSummary(
  userId,
  appointmentId
) {
  const appointment =
    await getAppointmentForPatient(
      userId,
      appointmentId
    );

  if (!appointment.preVisitSummary) {
    throw new ApiError(
      404,
      "Pre-visit summary is not available"
    );
  }

  return appointment.preVisitSummary;
}

async function getDoctorPreVisitSummary(
  userId,
  appointmentId
) {
  const appointment =
    await getAppointmentForDoctor(
      userId,
      appointmentId
    );

  if (!appointment.preVisitSummary) {
    throw new ApiError(
      404,
      "Pre-visit summary is not available"
    );
  }

  return appointment.preVisitSummary;
}

async function generatePostVisitSummary(
  userId,
  appointmentId
) {
  const appointment =
    await getAppointmentForDoctor(
      userId,
      appointmentId
    );

  if (!appointment.postVisitNotes) {
    throw new ApiError(
      400,
      "Doctor must add post-visit notes before generating a post-visit summary"
    );
  }

  const result =
    generateLocalPostVisitSummary(
      appointment.postVisitNotes.doctorNotes,
      appointment.postVisitNotes.prescriptionText
    );

  const summary =
    await prisma.postVisitSummary.upsert({
      where: {
        appointmentId,
      },
      update: {
        patientFriendlyText:
          result.patientFriendlyText,
        medicationSchedule:
          result.medicationSchedule,
        followUpSteps:
          result.followUpSteps,
        status: "SUCCESS",
      },
      create: {
        appointmentId,
        patientFriendlyText:
          result.patientFriendlyText,
        medicationSchedule:
          result.medicationSchedule,
        followUpSteps:
          result.followUpSteps,
        status: "SUCCESS",
      },
    });

  return summary;
}

async function getPatientPostVisitSummary(
  userId,
  appointmentId
) {
  const appointment =
    await getAppointmentForPatient(
      userId,
      appointmentId
    );

  if (!appointment.postVisitSummary) {
    throw new ApiError(
      404,
      "Post-visit summary is not available"
    );
  }

  return appointment.postVisitSummary;
}

async function getDoctorPostVisitSummary(
  userId,
  appointmentId
) {
  const appointment =
    await getAppointmentForDoctor(
      userId,
      appointmentId
    );

  if (!appointment.postVisitSummary) {
    throw new ApiError(
      404,
      "Post-visit summary is not available"
    );
  }

  return appointment.postVisitSummary;
}

module.exports = {
  generatePreVisitSummary,
  getPatientPreVisitSummary,
  getDoctorPreVisitSummary,
  generatePostVisitSummary,
  getPatientPostVisitSummary,
  getDoctorPostVisitSummary,
};