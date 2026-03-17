const User = require("../models/User");

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
}

module.exports = {updateUserProfile};