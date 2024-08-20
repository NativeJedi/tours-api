class ApiError extends Error {
  isOperational = true;

  constructor({
    message,
    statusCode,
  }) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

const catchAsync = (fn) => (req, res, next) => {
  return fn(req, res, next).catch(next);
};

module.exports = {
  ApiError,
  catchAsync,
};
