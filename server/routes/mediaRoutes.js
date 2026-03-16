const express = require("express");
const router = express.Router();
const { getPopularMovies, getMovieDetails, updateUserMedia, 
    getUserMedia, searchMovies, getUserLibrary} = require("../controllers/mediaController");

// The base URL for these will be /api/media
router.get("/movies/popular", getPopularMovies);
router.get("/movies/search/:query",searchMovies);
router.get("/movies/:id", getMovieDetails);
router.post("/update", updateUserMedia);
router.get("/user/:userId/movie/:externalId", getUserMedia);
router.get("/user/:userId/library", getUserLibrary);

module.exports = router;