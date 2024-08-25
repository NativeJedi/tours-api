const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { catchAsync, ApiError } = require('../utils/errors');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(user._id);

  res.status(201).json({
    status: 'success',
    data: {
      token,
      user,
    },
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and pass exists
  if (!email || !password) {
    next(
      new ApiError({
        message: 'Please provide email and password',
        statusCode: 400,
      }),
    );

    return;
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.isPasswordCorrect(password, user.password))) {
    next(
      new ApiError({ message: 'Incorrect email or password', statusCode: 401 }),
    );

    return;
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    data: {
      token,
    },
  });
});

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

module.exports = {
  signup,
  login,
  getAllUsers,
};
