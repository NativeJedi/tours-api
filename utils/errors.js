class ApiError extends Error {
  constructor({ message, statusCode }) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

module.exports = {
  ApiError,
  catchAsync,
};
