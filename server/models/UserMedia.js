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
        enum: ["in progress", "save", "finished"],
        default: "save"
    },
    // Review Section
    rating: { type: Number, min: 1, max: 5 },
    reviewText: String,
    // Physical Inventory Section
    isPhysical: { type: Boolean, default: false },
    format: {
        type: String,
        enum: ["dvd", "blu-ray", "4k", "vhs", "vinyl", "cd", "hardcover", "paperback", "none"],
        default: "none"
    },
    physicalStatus: {
        type: String,
        enum: ["available", "loaned", "lost", "none"],
        default: "none"
    },
    // Physical Collection Extended Fields
    price: { type: Number, default: null },           // Estimated/purchase price in user's currency
    purchaseDate: { type: Date, default: null },       // When the physical copy was acquired
    shelfNumber: { type: Number, default: 1 }          // Which shelf number the item lives on (for the 3D carousel)
}, { timestamps: true });

// Ensures a user can't add the same media entry to their list twice
userMediaSchema.index({ userId: 1, mediaId: 1 }, { unique: true });

module.exports = mongoose.model("UserMedia", userMediaSchema);