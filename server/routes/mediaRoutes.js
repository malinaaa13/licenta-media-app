const express = require("express");
const router = express.Router();
const { getPopularMovies} = require("../controllers/mediaController");

// The base URL for these will be /api/media
router.get("/movies/popular", getPopularMovies);

module.exports = router;