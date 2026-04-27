const Friendship = require('../models/Friendship');
const Notification = require('../models/Notification');
const User = require('../models/User');
const List = require('../models/List');
const UserMedia = require('../models/UserMedia');
const Review = require('../models/Review');

// 1. Send a friend request
const sendFriendRequest = async (req, res) => {
    try {
        const { requesterId, recipientId } = req.body;

        if (requesterId === recipientId) {
            return res.status(400).json({ message: "You cannot send a request to yourself." });
        }

        // Check if a friendship or pending request already exists in either direction
        const existingFriendship = await Friendship.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId }
            ]
        });

        if (existingFriendship) {
            return res.status(400).json({ message: "Friendship or request already exists." });
        }

        // Create the new pending friendship
        const newFriendship = new Friendship({
            requester: requesterId,
            recipient: recipientId,
            status: 'pending'
        });
        await newFriendship.save();

        // Create a notification for the recipient
        const newNotification = new Notification({
            recipient: recipientId,
            sender: requesterId,
            type: 'friend_request',
            link: `/user/${requesterId}` // Link to the sender's profile
        });
        await newNotification.save();

        res.status(201).json({ message: "Friend request sent!" });
    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 2. Accept a friend request
const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const friendship = await Friendship.findByIdAndUpdate(
            requestId,
            { status: 'accepted' },
            { new: true }
        );

        if (!friendship) return res.status(404).json({ message: "Request not found." });

        // Notify the original sender that their request was accepted
        const newNotification = new Notification({
            recipient: friendship.requester,
            sender: friendship.recipient,
            type: 'request_accepted',
            link: `/user/${friendship.recipient}`
        });
        await newNotification.save();

        res.status(200).json({ message: "Friend request accepted!", friendship });
    } catch (error) {
        console.error("Error accepting request:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 3. Remove friend or Reject/Cancel request
const removeFriendship = async (req, res) => {
    try {
        const { requestId } = req.params;
        await Friendship.findByIdAndDelete(requestId);
        res.status(200).json({ message: "Friendship or request removed." });
    } catch (error) {
        console.error("Error removing friendship:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 4. Get a user's accepted friends
const getUserFriends = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all accepted friendships where the user is either the requester or recipient
        const friendships = await Friendship.find({
            $or: [{ requester: userId }, { recipient: userId }],
            status: 'accepted'
        }).populate('requester recipient', 'username profilePicture bio');

        // Extract just the "other" user from the friendship document
        const friends = friendships.map(f => {
            return f.requester._id.toString() === userId ? f.recipient : f.requester;
        });

        res.status(200).json(friends);
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 5. Get pending requests RECEIVED by the user
const getPendingRequests = async (req, res) => {
    try {
        const { userId } = req.params;
        const requests = await Friendship.find({
            recipient: userId,
            status: 'pending'
        }).populate('requester', 'username profilePicture');

        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 6. Global User Search (for the Friends page search bar)
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        // Search by username, ignoring case
        const users = await User.find({
            username: { $regex: q, $options: 'i' }
        }).select('username profilePicture bio');
        
        res.status(200).json(users);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 7. Check specific friendship status (Useful for the profile page button)
const getFriendshipStatus = async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;
        const friendship = await Friendship.findOne({
            $or: [
                { requester: userId1, recipient: userId2 },
                { requester: userId2, recipient: userId1 }
            ]
        });

        if (!friendship) return res.status(200).json({ status: 'none' });
        
        // Return exactly how they are related so the frontend can render the right button
        res.status(200).json({ 
            status: friendship.status, 
            friendshipId: friendship._id,
            requesterId: friendship.requester 
        });
    } catch (error) {
        console.error("Error checking status:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 8. Get Friend Activity Feed
const getFriendFeed = async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Find friends and map their data
        const friendships = await Friendship.find({
            $or: [{ requester: userId }, { recipient: userId }],
            status: 'accepted'
        }).populate('requester recipient', 'username profilePicture');

        const friendIds = [];
        const friendMap = {};

        friendships.forEach(f => {
            const friend = f.requester._id.toString() === userId ? f.recipient : f.requester;
            friendIds.push(friend._id);
            friendMap[friend._id.toString()] = friend;
        });

        if (friendIds.length === 0) return res.status(200).json([]);

        // 2. FETCH MOVIES AND REVIEWS (from UserMedia)
        // Notice we are now strictly using 'userId' and the exact lowercase enums
        const recentMedia = await UserMedia.find({ 
            userId: { $in: friendIds },
            status: { $in: ['in progress', 'save', 'finished'] } 
        })
        .populate('userId', 'username profilePicture')
        .populate('mediaId') // Populates the movie title and poster
        .sort({ updatedAt: -1 })
        .limit(20);

        const mediaAndReviewFeed = [];

        recentMedia.forEach(item => {
            // Check if the user left a review for this movie
            if (item.reviewText || item.rating) {
                mediaAndReviewFeed.push({
                    id: item._id.toString() + '-review',
                    type: 'review',
                    action: 'reviewed',
                    user: item.userId,
                    mediaTitle: item.mediaId?.title || "a movie",
                    posterPath: item.mediaId?.posterPath,
                    tmdbId: item.mediaId?.externalId,
                    rating: item.rating,
                    text: item.reviewText,
                    date: item.updatedAt
                });
            } else {
                // Standard status update if there is no review attached
                let actionText = '';
                if (item.status === 'finished') actionText = 'finished watching';
                else if (item.status === 'in progress') actionText = 'is currently watching';
                else actionText = 'saved the movie';

                mediaAndReviewFeed.push({
                    id: item._id.toString() + '-media',
                    type: 'userMedia',
                    action: actionText,
                    user: item.userId, // Maps the user data correctly
                    mediaTitle: item.mediaId?.title || "a movie",
                    posterPath: item.mediaId?.posterPath,
                    tmdbId: item.mediaId?.externalId,
                    date: item.updatedAt
                });
            }
        });

        // 3. FETCH CREATED LISTS
        const recentLists = await List.find({
            creator: { $in: friendIds },
            visibility: 'public'
        })
        .populate('creator', 'username profilePicture')
        .sort({ createdAt: -1 })
        .limit(10);

        const listFeed = recentLists.map(list => ({
            id: list._id.toString() + '-list',
            type: 'list',
            action: 'created a new list',
            user: list.creator,
            listTitle: list.title,
            listId: list._id,
            moviesPreview: list.movies.slice(0, 3), 
            date: list.createdAt
        }));

        // 4. FETCH SAVED LISTS
        const savedLists = await List.find({
            savedBy: { $in: friendIds },
            visibility: 'public'
        }).limit(10);

        const savedListFeed = [];
        savedLists.forEach(list => {
            friendIds.forEach(friendId => {
                if (list.savedBy.some(id => id.toString() === friendId.toString())) {
                    savedListFeed.push({
                        id: list._id.toString() + friendId.toString() + '-saved',
                        type: 'saved_list',
                        action: 'saved the list',
                        user: friendMap[friendId.toString()],
                        listTitle: list.title,
                        listId: list._id,
                        date: list.updatedAt
                    });
                }
            });
        });

        // 5. MERGE AND SORT EVERYTHING
        const feed = [...mediaAndReviewFeed, ...listFeed, ...savedListFeed];
        feed.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json(feed.slice(0, 40));

    } catch (error) {
        console.error("Error generating feed:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    sendFriendRequest, acceptFriendRequest, removeFriendship,
    getUserFriends, getPendingRequests, searchUsers, getFriendshipStatus, getFriendFeed
};