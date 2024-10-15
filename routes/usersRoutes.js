const express = require('express');
const authController = require('../controllers/authController');

const usersRouter = express.Router();

usersRouter.post('/signup', authController.signup);
usersRouter.post('/login', authController.login);
usersRouter.post('/forgotPassword', authController.forgotPassword);
usersRouter.patch('/resetPassword/:resetToken', authController.resetPassword);
usersRouter.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updateMyPassword,
);
usersRouter.patch('/updateMe', authController.protect, authController.updateMe);
usersRouter.delete(
  '/deleteMe',
  authController.protect,
  authController.deleteMe,
);
usersRouter.get(
  '/',
  authController.protect,
  authController.restrictTo('admin'),
  authController.getAllUsers,
);

module.exports = usersRouter;
