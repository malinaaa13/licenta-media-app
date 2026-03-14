const mongoose = require("mongoose");

const userMediaSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    mediaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Media", 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["wishlist", "finished", "dropped"], 
        default: "wishlist" 
    },
    // Review Section
    rating: { type: Number, min: 1, max: 5 }, 
    reviewText: String,
    // Physical Inventory Section
    isPhysical: { type: Boolean, default: false },
    physicalStatus: { 
        type: String, 
        enum: ["available", "loaned", "lost", "none"], 
        default: "none" 
    }
}, { timestamps: true });

// Ensures a user can't add the same media entry to their list twice
userMediaSchema.index({ userId: 1, mediaId: 1 }, { unique: true });

module.exports = mongoose.model("UserMedia", userMediaSchema);