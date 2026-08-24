const asyncHandler = require("../utils/asyncHandler");
const summaryService = require("../services/summary.service");

const generatePreVisitSummary =
  asyncHandler(async (req, res) => {
    const summary =
      await summaryService.generatePreVisitSummary(
        req.user.id,
        req.params.appointmentId
      );

    res.status(201).json({
      summary,
    });
  });

const getPatientPreVisitSummary =
  asyncHandler(async (req, res) => {
    const summary =
      await summaryService.getPatientPreVisitSummary(
        req.user.id,
        req.params.appointmentId
      );

    res.json({
      summary,
    });
  });

const getDoctorPreVisitSummary =
  asyncHandler(async (req, res) => {
    const summary =
      await summaryService.getDoctorPreVisitSummary(
        req.user.id,
        req.params.appointmentId
      );

    res.json({
      summary,
    });
  });

const generatePostVisitSummary =
  asyncHandler(async (req, res) => {
    const summary =
      await summaryService.generatePostVisitSummary(
        req.user.id,
        req.params.appointmentId
      );

    res.status(201).json({
      summary,
    });
  });

const getPatientPostVisitSummary =
  asyncHandler(async (req, res) => {
    const summary =
      await summaryService.getPatientPostVisitSummary(
        req.user.id,
        req.params.appointmentId
      );

    res.json({
      summary,
    });
  });

const getDoctorPostVisitSummary =
  asyncHandler(async (req, res) => {
    const summary =
      await summaryService.getDoctorPostVisitSummary(
        req.user.id,
        req.params.appointmentId
      );

    res.json({
      summary,
    });
  });

module.exports = {
  generatePreVisitSummary,
  getPatientPreVisitSummary,
  getDoctorPreVisitSummary,
  generatePostVisitSummary,
  getPatientPostVisitSummary,
  getDoctorPostVisitSummary,
};