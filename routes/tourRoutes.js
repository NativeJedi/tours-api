const express = require('express');
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getToursStatistic,
  getMonthlyPlan,
} = require('../controllers/tourController');
const authController = require('../controllers/authController');

const toursRouter = express.Router();

// Example of param middleware
// toursRouter.param('id', checkID);

toursRouter.route('/top-5-cheap').get(aliasTopTours, getAllTours);
toursRouter.route('/monthly-plan/:year').get(getMonthlyPlan);

toursRouter.route('/stats').get(getToursStatistic);
toursRouter
  .route('/')
  .get(authController.protect, getAllTours)
  .post(createTour);
toursRouter
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    deleteTour,
  );

module.exports = toursRouter;
