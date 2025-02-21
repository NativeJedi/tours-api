const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const expressMongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const toursRouter = require('./routes/tourRoutes');
const usersRouter = require('./routes/usersRoutes');
const { ApiError } = require('./utils/errors');
const { globalErrorHandler } = require('./controllers/errorController');

const app = express();

// Set security HTTP headers
app.use(helmet());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in an hour',
});

// SECURITY: protect from DDOS attacks
app.use('/api', limiter);

// SECURITY: limit protects from request overload
app.use(express.json({ limit: '10kb' }));

// SECURITY: NoSQL injection
app.use(expressMongoSanitize());

// SECURITY: html injection
app.use(xssClean());

// SECURITY: prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(express.static(`${__dirname}/public`));

app.use('/api/v1/tours', toursRouter);

app.use('/api/v1/users', usersRouter);

app.all('*', (req, res, next) => {
  const error = new ApiError({
    statusCode: 404,
    message: `Can't find ${req.originalUrl} on this server`,
  });

  next(error);
});

app.use(globalErrorHandler);

module.exports = app;
