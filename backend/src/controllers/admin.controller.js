const asyncHandler = require("../utils/asyncHandler");
const adminService = require("../services/admin.service");

const createDoctor = asyncHandler(async (req, res) => {
  const result = await adminService.createDoctor(req.body);

  res.status(201).json(result);
});

const listDoctors = asyncHandler(async (req, res) => {
  const doctors = await adminService.listDoctors();

  res.json({
    doctors,
  });
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await adminService.updateDoctor(
    req.params.doctorId,
    req.body
  );

  res.json({
    doctor,
  });
});

module.exports = {
  createDoctor,
  listDoctors,
  updateDoctor,
};