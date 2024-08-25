const User = require('../models/userModel');
const { catchAsync } = require('../utils/errors');
const jwt = require('jsonwebtoken');

const signup = catchAsync(async (req, res, next) => {
  const { name, email, _id } = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = jwt.sign({ id: _id, 'secret' });

  res.status(201).json({
    status: 'success',
    data: {
      user: {
        name,
        email,
        token,
      },
    },
  });
});

const signin = catchAsync(async (req, res, next) => {

  res.status(201).json({
    status: 'success',
    data: {},
  });
});

module.exports = {
  signup,
  signin,
};
