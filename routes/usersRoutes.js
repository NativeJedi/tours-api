const express = require('express');
const authController = require('../controllers/authController');

const usersRouter = express.Router();

usersRouter.post('/signup', authController.signup);
usersRouter.post('/login', authController.login);
usersRouter.post('/forgotPassword', authController.forgotPassword);
usersRouter.patch('/resetPassword/:resetToken', authController.resetPassword);
usersRouter.get(
  '/',
  authController.protect,
  authController.restrictTo('admin'),
  authController.getAllUsers,
);

module.exports = usersRouter;
