const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const {
  catchAsync,
  ApiError,
  LockedAccountError,
  InvalidCredentialsError,
} = require('../utils/errors');
const { sendEmail } = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const getTokenFromRequest = (req) => {
  const { authorization } = req.headers;

  return authorization?.startsWith('Bearer')
    ? authorization?.split?.(' ')?.[1]
    : null;
};

const decodeToken = async (token) =>
  promisify(jwt.verify)(token, process.env.JWT_SECRET);

const createTokenAndSend = (res, statusCode, user) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: 'success',
    data: {
      token,
      user,
    },
  });
};

const signup = catchAsync(async (req, res) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  createTokenAndSend(res, 201, user);
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

  const sendInvalidCredentialsError = () => next(new InvalidCredentialsError());

  if (!user) {
    sendInvalidCredentialsError();

    return;
  }

  if (user.isAccountLocked()) {
    next(new LockedAccountError());

    return;
  }

  if (!(await user.isPasswordCorrect(password, user.password))) {
    await user.increaseLoginAttempts();

    sendInvalidCredentialsError();

    return;
  }

  await user.resetLoginAttempts();

  createTokenAndSend(res, 200, user);
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
  const token = getTokenFromRequest(req);

  if (!token || token === 'null') {
    next(new ApiError({ message: 'User is not authorized', statusCode: 401 }));
    return;
  }

  // 2) Verify token
  const decoded = await decodeToken(token);

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

  if (currentUser.isAccountLocked()) {
    next(new LockedAccountError());

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

const restrictTo = (...roles) =>
  catchAsync(async (req, res, next) => {
    const { role } = req.user;

    if (!roles.includes(role)) {
      next(
        new ApiError({
          message: 'User has no permission to perform this action',
          statusCode: 403,
        }),
      );
      return;
    }

    next();
  });

const forgotPassword = catchAsync(async (req, res, next) => {
  // Check if user exists
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    next(new ApiError({ message: 'User is not exists', statusCode: 404 }));
    return;
  }

  if (user.isAccountLocked()) {
    next(new LockedAccountError());

    return;
  }

  // Create reset token
  const resetToken = user.createResetToken();

  // Save it to DB
  await user.save();

  // Send user token to email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot a password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    console.error(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return next(
      new ApiError({
        message: 'There was an error sending the email. Try again later!',
        statusCode: 500,
      }),
    );
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user by token
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token is not expired, and user exists, set the new password
  if (!user) {
    return next(
      new ApiError({
        message: 'Token is invalid or expired.',
        statusCode: 404,
      }),
    );
  }

  // 3) Update changedPasswordAt
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) Log user in and send back JWT token
  createTokenAndSend(res, 200, user);
});

const updateMyPassword = catchAsync(async (req, res, next) => {
  const {
    body: { currentPassword, password, passwordConfirm },
  } = req;

  const user = await User.findById(req.user.id).select('+password');

  const isPasswordCorrect = await user.isPasswordCorrect(
    currentPassword,
    user.password,
  );

  if (!isPasswordCorrect) {
    next(new ApiError({ message: 'Incorrect password', statusCode: 401 }));

    return;
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;

  await user.save();

  createTokenAndSend(res, 200, user);
});

const updateMe = catchAsync(async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, email },
    { runValidators: true, new: true },
  );

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

const deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

module.exports = {
  signup,
  login,
  getAllUsers,
  protect,
  restrictTo,
  resetPassword,
  forgotPassword,
  updateMyPassword,
  updateMe,
  deleteMe,
};
