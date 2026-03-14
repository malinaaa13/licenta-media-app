const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
    externalId: { 
        type: String,
        required: true, 
        unique: true }, // TMDB ID, ISBN, or Spotify ID
    type: { 
        type: String, 
        enum: ["movie", "book", "album"], 
        required: true },
    title: { 
        type: String, 
        required: true },
    creator: String,      // Director, Author, or Artist
    genres: [String],
    posterPath: String,
    releaseYear: Number,
    description: String
}, { timestamps: true });

module.exports = mongoose.model("Media", mediaSchema);