const asyncHandler = require("../utils/asyncHandler");
const availabilityService = require("../services/availability.service");

const searchDoctors = asyncHandler(async (req, res) => {
  const doctors = await availabilityService.searchDoctors(
    req.query.specialisation
  );

  res.json({
    doctors,
  });
});

const getSlots = asyncHandler(async (req, res) => {
  const result = await availabilityService.getAvailableSlots(
    req.params.doctorId,
    req.query.date
  );

  res.json(result);
});

const addWorkingHours = asyncHandler(async (req, res) => {
  const record = await availabilityService.addWorkingHours(
    req.params.doctorId,
    req.body
  );

  res.status(201).json({
    workingHours: record,
  });
});

const listWorkingHours = asyncHandler(async (req, res) => {
  const records = await availabilityService.listWorkingHours(
    req.params.doctorId
  );

  res.json({
    workingHours: records,
  });
});

const deleteWorkingHours = asyncHandler(async (req, res) => {
  await availabilityService.deleteWorkingHours(
    req.params.doctorId,
    req.params.id
  );

  res.status(204).send();
});

const addLeave = asyncHandler(async (req, res) => {
  const record = await availabilityService.addLeave(
    req.params.doctorId,
    req.body
  );

  res.status(201).json({
    leave: record,
  });
});

const listLeave = asyncHandler(async (req, res) => {
  const records = await availabilityService.listLeave(
    req.params.doctorId
  );

  res.json({
    leave: records,
  });
});

const deleteLeave = asyncHandler(async (req, res) => {
  await availabilityService.deleteLeave(
    req.params.doctorId,
    req.params.id
  );

  res.status(204).send();
});

module.exports = {
  searchDoctors,
  getSlots,
  addWorkingHours,
  listWorkingHours,
  deleteWorkingHours,
  addLeave,
  listLeave,
  deleteLeave,
};