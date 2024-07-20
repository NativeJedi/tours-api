const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel.js');

dotenv.config({ path: './config.env' });

const { DATABASE, DATABASE_PASSWORD } = process.env;

const CONNECTION = DATABASE.replace('<PASSWORD>', DATABASE_PASSWORD);

mongoose
  .connect(CONNECTION)
  .then(({ connections }) => console.log('DB connection success!'));

const toursJson = fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8');

const tours = JSON.parse(toursJson);

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully loaded');
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfully deleted');
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

if (process.argv[2] === '--import') {
  importData();
}

if (process.argv[2] === '--delete') {
  deleteData();
}
