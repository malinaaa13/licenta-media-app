const User = require("../models/User");
const UserMedia = require("../models/UserMedia");
const List = require("../models/List");
const Friendship = require("../models/Friendship");

const updateUserProfile = async (req, res ) => {
    try{
        const { userId } = req.params;
        const { profilePicture, bio, favorites } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture, bio, favorites },
            { new: true }
        );

        if(!updatedUser) {
            return res.status(404).json({ message: "User not found "});
        }

        res.status(200).json(updatedUser);
    } catch(error) {
        console.error("Error updating profile:", error);
        res.status(500).json({message: "Server error updating profile"});
    }

    
};

const getUserPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        // Extragem doar username, poza, descrierea și filmele favorite
        const userProfile = await User.findById(userId).select('username profilePicture bio favorites');
        
        if (!userProfile) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(userProfile);
    } catch (error) {
        console.error("Error fetching public profile:", error);
        res.status(500).json({ message: "Server error" });
    }
}

const getUserStats = async (req, res) => {
    try {
        const { userId } = req.params;

        const [totalWatched, totalInProgress, totalListsCreated, totalSavedLists, totalFriends] = await Promise.all([
            UserMedia.countDocuments({
                userId,
                status: { $in: ["finished", "Finished"] }
            }),
            UserMedia.countDocuments({
                userId,
                status: { $in: ["in progress", "In Progress"] }
            }),
            List.countDocuments({ creator: userId }),
            List.countDocuments({ savedBy: userId }),
            Friendship.countDocuments({
                status: "accepted",
                $or: [
                    { requester: userId },
                    { recipient: userId }
                ]
            })
        ]);

        res.status(200).json({
            totalWatched,
            totalInProgress,
            totalListsCreated,
            totalSavedLists,
            totalFriends
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ message: "Server error while fetching user statistics." });
    }
};

module.exports = { updateUserProfile, getUserPublicProfile, getUserStats };