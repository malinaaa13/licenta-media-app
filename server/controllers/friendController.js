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

const getFriendFeed = async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Get friend IDs
        const friendships = await Friendship.find({
            $or: [{ requester: userId }, { recipient: userId }],
            status: 'accepted'
        });

        const friendIds = friendships.map(f => 
            f.requester.toString() === userId ? f.recipient.toString() : f.requester.toString()
        );

        if (friendIds.length === 0) return res.status(200).json([]);

        let feed = [];

        // 2. Fetch UserMedia Updates (Finished, In Progress, Saved/Plan to Watch)
        const recentMedia = await UserMedia.find({ 
            user: { $in: friendIds },
            status: { $in: ['Finished', 'In Progress', 'Saved', 'Plan to Watch'] } 
        })
        .populate('user', 'username profilePicture')
        .sort({ updatedAt: -1 })
        .limit(15);

        const mediaFeed = recentMedia.map(item => {
            let actionText = '';
            if (item.status === 'Finished') actionText = 'finished watching';
            else if (item.status === 'In Progress') actionText = 'is currently watching';
            else actionText = 'wants to watch';

            return {
                id: item._id.toString() + '-media',
                type: 'userMedia',
                action: actionText,
                user: item.user,
                mediaTitle: item.mediaId?.title || "a movie", 
                posterPath: item.mediaId?.posterPath,
                tmdbId: item.mediaId?.externalId,
                date: item.updatedAt
            };
        });

        // 3. Fetch Created Lists
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

        // 4. Fetch Saved Lists (Lists where savedBy includes a friend)
        const savedLists = await List.find({
            savedBy: { $in: friendIds },
            visibility: 'public'
        })
        .populate('creator', 'username profilePicture') // We also need to know who made it
        .limit(10);

        // We have to figure out WHICH friend saved it to display it properly
        const savedListFeed = [];
        savedLists.forEach(list => {
            friendIds.forEach(friendId => {
                if (list.savedBy.includes(friendId)) {
                    // We need to fetch the friend's user data to display their avatar (basic mock here)
                    savedListFeed.push({
                        id: list._id.toString() + friendId + '-saved',
                        type: 'saved_list',
                        action: 'saved the list',
                        user: { _id: friendId, username: 'yourfriend' }, // We'll handle exact name in UI
                        listTitle: list.title,
                        listId: list._id,
                        date: list.updatedAt // Approximate time they saved it
                    });
                }
            });
        });

        // 5. Fetch Reviews
        const recentReviews = await Review.find({
            user: { $in: friendIds }
        })
        .populate('user', 'username profilePicture')
        .sort({ createdAt: -1 })
        .limit(15);

        const reviewFeed = recentReviews.map(review => ({
            id: review._id.toString() + '-review',
            type: 'review',
            action: 'reviewed',
            user: review.user,
            mediaTitle: review.movieTitle,
            posterPath: review.posterPath,
            tmdbId: review.tmdbId,
            rating: review.rating,
            text: review.text,
            date: review.createdAt
        }));

        // 6. Merge & Sort everything by date
        feed = [...mediaFeed, ...listFeed, ...savedListFeed, ...reviewFeed];
        feed.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json(feed.slice(0, 30));

    } catch (error) {
        console.error("Error fetching friend feed:", error);
        res.status(500).json({ message: "Server error generating feed" });
    }
};

module.exports = {
    sendFriendRequest, acceptFriendRequest, removeFriendship,
    getUserFriends, getPendingRequests, searchUsers, getFriendshipStatus, getFriendFeed
};