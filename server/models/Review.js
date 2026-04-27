const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tmdbId: {
    type: String,
    required: true
  },
  movieTitle: {
    type: String,
    required: true
  },
  posterPath: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  text: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);