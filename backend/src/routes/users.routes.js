const express = require("express");
const authenticate = require("../middleware/authenticate");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,

        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            dob: true,
          },
        },

        doctor: {
          select: {
            id: true,
            name: true,
            specialisation: true,
            slotDurationMinutes: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      user,
    });
  })
);

module.exports = router;