const ApiError = require("../utils/ApiError");

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  console.error(err);

  return res.status(500).json({
    error: "Internal server error",
  });
}

module.exports = errorHandler;