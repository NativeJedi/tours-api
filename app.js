const express = require('express');
const toursRouter = require('./routes/tourRoutes');

const app = express();

app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.use((req, res, next) => {
  console.log('Middleware example');

  next();
});

app.use('/api/v1/tours', toursRouter);

module.exports = app;
