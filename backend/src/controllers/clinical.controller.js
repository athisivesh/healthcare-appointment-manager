const asyncHandler = require("../utils/asyncHandler");
const clinicalService = require("../services/clinical.service");

const submitSymptoms = asyncHandler(async (req, res) => {
  const symptomForm =
    await clinicalService.submitSymptoms(
      req.user.id,
      req.params.appointmentId,
      req.body.symptomsText
    );

  res.status(201).json({
    symptomForm,
  });
});

const getPatientSymptoms = asyncHandler(async (req, res) => {
  const symptomForm =
    await clinicalService.getPatientSymptoms(
      req.user.id,
      req.params.appointmentId
    );

  res.json({
    symptomForm,
  });
});

const getDoctorAppointments = asyncHandler(async (req, res) => {
  const appointments =
    await clinicalService.getDoctorAppointments(
      req.user.id
    );

  res.json({
    appointments,
  });
});

const getDoctorAppointment = asyncHandler(async (req, res) => {
  const appointment =
    await clinicalService.getDoctorAppointment(
      req.user.id,
      req.params.appointmentId
    );

  res.json({
    appointment,
  });
});

const savePostVisitNotes = asyncHandler(async (req, res) => {
  const notes =
    await clinicalService.savePostVisitNotes(
      req.user.id,
      req.params.appointmentId,
      req.body.doctorNotes,
      req.body.prescriptionText
    );

  res.status(201).json({
    notes,
  });
});

const getPatientPostVisitNotes =
  asyncHandler(async (req, res) => {
    const notes =
      await clinicalService.getPatientPostVisitNotes(
        req.user.id,
        req.params.appointmentId
      );

    res.json({
      notes,
    });
  });

module.exports = {
  submitSymptoms,
  getPatientSymptoms,
  getDoctorAppointments,
  getDoctorAppointment,
  savePostVisitNotes,
  getPatientPostVisitNotes,
};