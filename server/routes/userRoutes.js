const express = require("express");
const router = express.Router();

const { updateUserProfile } = require("../controllers/userController");

router.put("/:userId/profile", updateUserProfile);

module.exports = router;