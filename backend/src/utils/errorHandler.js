const logger = require("./logger");

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function notFoundHandler(req, res) {
  return res.status(404).json({
    error: true,
    message: "Route not found"
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = statusCode >= 500 ? "Internal server error" : err.message;

  logger.error("request_failed", {
    path: req.path,
    method: req.method,
    statusCode,
    message: err.message,
    details: err.details || null
  });

  return res.status(statusCode).json({
    error: true,
    message,
    details: err.details || undefined
  });
}

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler
};
