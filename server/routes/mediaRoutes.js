const express = require("express");
const router = express.Router();
const { getPopularMovies, getMovieDetails, updateUserMedia, 
    getUserMedia, searchMovies, getUserLibrary,
    removeUserMedia, getMovieReviews, getSimilarMovies} = require("../controllers/mediaController");

// The base URL for these will be /api/media
router.get("/movies/popular", getPopularMovies);
router.get("/movies/search/:query",searchMovies);
router.get("/movies/:id", getMovieDetails);
router.post("/update", updateUserMedia);
router.get("/user/:userId/movie/:externalId", getUserMedia);
router.get("/user/:userId/library", getUserLibrary);
router.delete("/user-media/:recordId", removeUserMedia);
router.get("/movies/:tmdbId/reviews", getMovieReviews);
router.get("/movies/:tmdbId/similar", getSimilarMovies);

module.exports = router;