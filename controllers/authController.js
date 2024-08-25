const User = require('../models/userModel');
const { catchAsync } = require('../utils/errors');

const signup = catchAsync(async (req, res, nex) => {
  const newUser = await User.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser,
    },
  });
});

module.exports = {
  signup,
};
