const express = require("express");
const router = express.Router();

const { updateUserProfile, getUserPublicProfile, getUserStats } = require("../controllers/userController");

router.get("/:userId/stats", getUserStats);
router.get("/:userId", getUserPublicProfile);
router.put("/:userId/profile", updateUserProfile);

module.exports = router;