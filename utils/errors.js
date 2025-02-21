class ApiError extends Error {
  constructor({ message, statusCode }) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.message = message;

    Error.captureStackTrace(this, this.constructor);
  }
}

class LockedAccountError extends ApiError {
  constructor() {
    super({
      message: 'Your account has been locked. Please, try again later',
      statusCode: 403,
    });
  }
}

class InvalidCredentialsError extends ApiError {
  constructor() {
    super({
      message: 'Invalid email or password',
      statusCode: 401,
    });
  }
}

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

module.exports = {
  ApiError,
  catchAsync,
  LockedAccountError,
  InvalidCredentialsError,
};
