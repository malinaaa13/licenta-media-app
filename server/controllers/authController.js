const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "This email already exists!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Format the username to be lowercase and without spaces
        const formattedUsername = username.toLowerCase().replace(/\s+/g, '');

        // Create the new user. 
        // We only pass the essentials. Mongoose will auto-fill the bio, profile picture, and favorites!
        const newUser = new User({
            username: formattedUsername,
            email: email,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ message: "Account created!" });

    } catch (error) {
        console.error("Error at register", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Log in a user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: "Incorrect email or password!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect email or password!" });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            message: "Successful login",
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
                favorites: user.favorites || []
            }
        });
    } catch (error) {
        console.error("Login error", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { registerUser, loginUser };