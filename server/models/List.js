const mongoose = require("mongoose");

const listSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    default: "" 
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // The array of movies in this list
  movies: [{
    tmdbId: String,
    title: String,
    posterPath: String
  }],
  // Array of user IDs who saved this list to their profile
  savedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }] 
}, { timestamps: true });

module.exports = mongoose.model("List", listSchema);