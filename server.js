const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: `${__dirname}/config.env` });

const { PORT, DATABASE, DATABASE_PASSWORD } = process.env;

const CONNECTION = DATABASE.replace('<PASSWORD>', DATABASE_PASSWORD);

mongoose
  .connect(CONNECTION)
  .then(({ connections }) => console.log('DB connection success!'));

app.listen(PORT, () => {
  console.log(`App port is ${PORT}`);
});
