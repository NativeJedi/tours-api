const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
    uniq: true,
    lowercase: true,
    required: [true, 'User email is required'],
    validate: [validator.isEmail, 'User email is not valid!'],
  },
  photo: String,
  password: {
    type: String,
    trim: true,
    required: [true, 'Please provide a password'],
    maxlength: [40, 'Password must be less than 40 characters'],
    minLength: [8, 'Password name must be at least 8 characters'],
  },
  passwordConfirm: {
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
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
