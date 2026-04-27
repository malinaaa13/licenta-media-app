const Notification = require('../models/Notification');

// Get all notifications for a user
const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.find({ recipient: userId })
            .populate('sender', 'username profilePicture')
            .sort({ createdAt: -1 }) // Newest first
            .limit(20); // Only bring the last 20

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Mark a single notification as read
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        console.error("Error marking notification:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Mark ALL notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.body;
        await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
        res.status(200).json({ message: "All marked as read" });
    } catch (error) {
        console.error("Error marking all notifications:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getUserNotifications, markAsRead, markAllAsRead };