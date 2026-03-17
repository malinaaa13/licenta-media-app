const express = require("express");
const router = express.Router();

const { updateUserProfile,getUserPublicProfile } = require("../controllers/userController");

router.get("/:userId", getUserPublicProfile);
router.put("/:userId/profile", updateUserProfile);

module.exports = router;