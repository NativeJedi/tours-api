const { ApiError } = require('../utils/errors');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;

  return new ApiError({
    message,
    statusCode: 400,
  });
};

const handleValidationErrorDB = (err) => {
  const errors = err.errors || {};

  const messages = Object.values(errors).map(({ message }) => message);

  const message = `Invalid data. ${messages.join('. ')}`;

  return new ApiError({
    message,
    statusCode: 400,
  });
};

const handleDuplicateFieldsErrorDB = (err) => {
  const message = `Duplicate field value: "${err.keyValue?.name}". Please, use another value.`;

  return new ApiError({
    message,
    statusCode: 400,
  });
};

const handleJWTError = () =>
  new ApiError({
    message: 'Invalid token. Please login again',
    statusCode: 401,
  });

const handleJWTExpiredError = () =>
  new ApiError({
    message: 'The token has expired. Login again',
    statusCode: 401,
  });

const sendProductionError = (err, res) => {
  if (!err.isOperational) {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });

    console.error('ERROR >> ', err);

    return;
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

const sendDevelopmentError = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const globalErrorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    let productionError = { ...err, message: err.message };

    if (err.name === 'CastError') {
      productionError = handleCastErrorDB(productionError);
    }

    if (err.code === 11000) {
      productionError = handleDuplicateFieldsErrorDB(productionError);
    }

    if (err.name === 'ValidationError') {
      productionError = handleValidationErrorDB(productionError);
    }

    if (err.name === 'JsonWebTokenError') {
      productionError = handleJWTError(err);
    }

    if (err.name === 'TokenExpiredError') {
      productionError = handleJWTExpiredError(err);
    }

    sendProductionError(productionError, res);
  } else {
    sendDevelopmentError(err, res);
  }
};

module.exports = { globalErrorHandler };
