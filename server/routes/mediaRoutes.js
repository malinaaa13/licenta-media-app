const express = require("express");
const router = express.Router();
const { getPopularMovies, getMovieDetails} = require("../controllers/mediaController");

// The base URL for these will be /api/media
router.get("/movies/popular", getPopularMovies);
router.get("/movies/:id", getMovieDetails);

module.exports = router;