const List = require('../models/List');

// 1. Create a new list
const createList = async (req, res) => {
    try {
        const { title, description, creator, movies, visibility } = req.body;
        const newList = new List({ title, description, creator, movies, visibility });
        const savedList = await newList.save();
        res.status(201).json(savedList);
    } catch (error) {
        console.error("Error creating list:", error);
        res.status(500).json({ message: "Server error creating list" });
    }
};

// 2. Get Popular Lists (Public only)
const getPopularLists = async (req, res) => {
    try {
        const lists = await List.find({ visibility: 'public' })
            .populate('creator', 'username profilePicture')
            .sort({ 'savedBy.length': -1 }) 
            .limit(10);
        res.status(200).json(lists);
    } catch (error) {
        console.error("Error fetching popular lists:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 3. Get User's Own Lists
const getMyLists = async (req, res) => {
    try {
        const lists = await List.find({ creator: req.params.userId })
            .populate('creator', 'username profilePicture')
            .sort({ createdAt: -1 });
        res.status(200).json(lists);
    } catch (error) {
        console.error("Error fetching my lists:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 4. Get Saved Lists
const getSavedLists = async (req, res) => {
    try {
        const lists = await List.find({ 
            savedBy: req.params.userId,
            visibility: { $ne: 'private' } 
        }).populate('creator', 'username profilePicture');
        res.status(200).json(lists);
    } catch (error) {
        console.error("Error fetching saved lists:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 5. Search Public Lists
const searchLists = async (req, res) => {
    try {
        const query = req.query.q;
        const lists = await List.find({
            visibility: 'public',
            title: { $regex: query, $options: 'i' }
        }).populate('creator', 'username profilePicture');
        res.status(200).json(lists);
    } catch (error) {
        console.error("Error searching lists:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 6. Get a specific list by ID
const getListDetails = async (req, res) => {
    try {
        const list = await List.findById(req.params.listId).populate('creator', 'username profilePicture');
        if (!list) return res.status(404).json({ message: "List not found" });
        
        res.status(200).json(list);
    } catch (error) {
        console.error("Error fetching list:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 7. Save or unsave a list
const toggleSaveList = async (req, res) => {
    try {
        const { listId } = req.params;
        const { userId } = req.body;

        const list = await List.findById(listId);
        if (!list) return res.status(404).json({ message: "List not found" });

        // ✨ THE FIX: We convert the MongoDB ObjectId to a string so it matches the frontend string exactly
        const hasSaved = list.savedBy.some(id => id.toString() === userId);

        if (hasSaved) {
            // If already saved, remove them
            list.savedBy = list.savedBy.filter(id => id.toString() !== userId);
        } else {
            // If not saved, add them
            list.savedBy.push(userId);
        }

        await list.save();
        res.status(200).json({ message: hasSaved ? "List unsaved" : "List saved", list });
    } catch (error) {
        console.error("Error toggling save:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateList = async (req, res) => {
    try{
        const {listId} = req.params;
        const {title, description, movies, visibility} = req.body;

        const updatedList = await List.findByIdAndUpdate(
            listId,
            { title, description, movies, visibility },
            { new: true }
        );
        res.status(200).json(updatedList);
    } catch (error) {
        res.status(500).json({ message: "Server error updating list" });
}
};

const deleteList = async (req, res) => {
    try {
        await List.findByIdAndDelete(req.params.listId);
        res.status(200).json({ message: "List deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting list" });
    }
};

module.exports = { 
    createList, getPopularLists, getListDetails, toggleSaveList, 
    getMyLists, getSavedLists, searchLists, updateList, deleteList
};