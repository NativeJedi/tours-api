const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Please provide a name'],
    maxlength: [20, 'User name must be less than 20 characters'],
    minLength: [1, 'User name must be at least 1 character'],
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    required: [true, 'User email is required'],
    validate: [validator.isEmail, 'User email is not valid!'],
  },
  photo: String,
  password: {
    select: false,
    type: String,
    trim: true,
    required: [true, 'Please provide a password'],
    maxlength: [40, 'Password must be less than 40 characters'],
    minLength: [8, 'Password name must be at least 8 characters'],
  },
  passwordConfirm: {
    select: false,
    type: String,
    trim: true,
    required: [true, 'Please confirm your password'],
    validate: {
      // this works only on CREATE and SAVE
      validator(value) {
        return value === this.password;
      },
      message: 'Password fields should be the same',
    },
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  passwordResetToken: {
    type: String,
    required: false,
  },
  passwordResetExpires: {
    type: String,
    required: false,
  },
});

userSchema.methods.isPasswordCorrect = async (
  candidatePassword,
  userPassword,
) => await bcrypt.compare(candidatePassword, userPassword);

userSchema.methods.isPasswordChangedAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return jwtTimestamp < changedTimeStamp;
  }

  return false;
};

// userSchema.methods.isResetTokenExpired = () => {
//   if (!this.passwordResetExpires) return false;
//
//   return Date.now() > this.passwordResetExpires;
// };

userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew()) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
