const express = require('express');
const toursRouter = require('./routes/tourRoutes');
const usersRouter = require('./routes/usersRoutes');
const { ApiError } = require('./utils/errors');
const { globalErrorHandler } = require('./controllers/errorController');

const app = express();

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use('/api/v1/tours', toursRouter);

app.use('/api/v1/users', usersRouter);

app.all('*', (req, res, next) => {
  const error = new ApiError({
    statusCode: 404,
    message: `Can't find ${req.originalUrl} on this server`,
  })

  next(error);
});

app.use(globalErrorHandler);

module.exports = app;
