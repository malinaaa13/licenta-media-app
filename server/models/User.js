const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    goals: {
        books: { type: Number, default: 0 },
        movies: { type: Number, default: 0 },
        albums: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema)