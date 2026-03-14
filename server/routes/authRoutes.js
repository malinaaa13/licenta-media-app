const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// The base URL for these will be /api
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;