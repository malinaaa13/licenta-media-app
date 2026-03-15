const express = require("express");
const router = express.Router();
const { getPopularMovies, getMovieDetails, updateUserMedia, getUserMedia} = require("../controllers/mediaController");

// The base URL for these will be /api/media
router.get("/movies/popular", getPopularMovies);
router.get("/movies/:id", getMovieDetails);
router.post("/update", updateUserMedia);
router.get("/user/:userId/movie/:externalId", getUserMedia);

module.exports = router;