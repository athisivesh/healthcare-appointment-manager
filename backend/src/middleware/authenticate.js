const jwtService = require("../services/jwt.service");
const ApiError = require("../utils/ApiError");

function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(
      new ApiError(401, "Missing or malformed Authorization header")
    );
  }

  const token = header.substring(7);

  try {
    const payload = jwtService.verifyToken(token);

    req.user = {
      id: payload.userId,
      role: payload.role,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token has expired"));
    }

    return next(new ApiError(401, "Invalid token"));
  }
}

module.exports = authenticate;