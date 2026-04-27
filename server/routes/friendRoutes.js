const express = require("express");
const router = express.Router();
const { 
    sendFriendRequest, acceptFriendRequest, removeFriendship,
    getUserFriends, getPendingRequests, searchUsers, getFriendshipStatus, getFriendFeed
} = require("../controllers/friendController");
const { get } = require("mongoose");

router.post("/request", sendFriendRequest);
router.put("/request/:requestId/accept", acceptFriendRequest);
router.delete("/request/:requestId", removeFriendship);
router.get("/user/:userId", getUserFriends);
router.get("/user/:userId/pending", getPendingRequests);
router.get("/search", searchUsers);
router.get("/status/:userId1/:userId2", getFriendshipStatus);
router.get("/user/:userId/feed", getFriendFeed);

module.exports = router;