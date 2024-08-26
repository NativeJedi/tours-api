const jwt = require('jsonwebtoken');
const { promisify } = require('util');
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
    passwordChangedAt: req.body.passwordChangedAt,
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

const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's included
  const { authorization } = req.headers;

  const token =
    authorization?.startsWith('Bearer') && authorization?.split?.(' ')?.[1];

  if (!token) {
    next(new ApiError({ message: 'User is not authorized', statusCode: 401 }));
    return;
  }
  // 2) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    next(
      new ApiError({
        message:
          'The user with such token does not exists anymore. Please log in again.',
        statusCode: 401,
      }),
    );
    return;
  }
  // 4) Check if user changed password after the token was issued
  if (currentUser.isPasswordChangedAfter(decoded.iat)) {
    next(
      new ApiError({
        message: 'User password is changed. Please log in again.',
        statusCode: 401,
      }),
    );
    return;
  }

  req.user = currentUser;

  next();
});

module.exports = {
  signup,
  login,
  getAllUsers,
  protect,
};
