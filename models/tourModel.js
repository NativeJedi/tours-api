const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

const toursSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name must be less than 40 characters'],
      minLength: [10, 'Tour name must be more than 10 characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can be easy, medium or difficult',
      },
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be more than 1'],
      max: [5, 'Rating must be below than 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only point on DOC when .create()
          return val < this.price;
        },
        message: 'Discount ({VALUE}) should be less then price',
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // DONT SHOW THIS FIELD IN RESULTS
    },
    startDates: [Date],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// DOCUMENTS MIDDLEWARE run ONLY for .save and .create but not for .update()
toursSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

toursSchema.virtual('durationInWeeks').get(function () {
  return Math.round(this.duration / 7);
});

const Tour = mongoose.model('Tour', toursSchema);

module.exports = Tour;
