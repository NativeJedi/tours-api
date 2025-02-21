const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.error(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION. Shutting down...');
  process.exit(1);
});

dotenv.config({ path: `${__dirname}/config.env` });

const { PORT, DATABASE, DATABASE_PASSWORD } = process.env;

const CONNECTION = DATABASE.replace('<PASSWORD>', DATABASE_PASSWORD);

mongoose.connect(CONNECTION).then(() => console.log('DB connection success!'));

const server = app.listen(PORT, () => {
  console.log(`App port is ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(err.name, err.message);
  console.log('UNHANDLED REJECTION. Shutting down...');

  server.close(() => {
    process.exit(1);
  });
});
