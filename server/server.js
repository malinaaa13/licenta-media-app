require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("./models/User")
const bcrypt = require("bcryptjs")


const connectDB = require("./config/db.js")
connectDB()

const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));
app.use(express.json())


app.get("/api/movies/popular", async(req, res) => {
    try{
        const apiKey = process.env.TMDB_API_KEY;

        const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=2`);

        res.json(tmdbResponse.data.results);
    }
    catch(error) {
        console.error("Error at TMDB:", error);
        res.status(500).json({ error: "Couldn't get the movies"});
    }
});

app.post("/api/register", async (req, res) => {
    try{
        const {username, email, password} = req.body;

        const existingUser = await User.findOne({ email : email});
        if(existingUser) {
            return res.status(400).json({ message: "This email already exists!"})
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            username: username,
            email: email,
            password: hashedPassword
        });
        
        await newUser.save();

        res.status(201).json({message: "Account created!"});

    }
    catch(error){
        console.error("Error at register", error);
        res.status(500).json({message: "Server error"});
    }
});

app.post("/api/login", async (req, res) => {
    try{
        const {email, password} = req.body;

        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(400).json({message: "Incorrect email or password!"});
        }
        
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({message: "Incorrect email or password!"});
        }

        const token = jwt.sign(
            { id: user._id},
            process.env.JWT_SECRET,
            { expiresIn: "24h"}
        );

        res.json({
            message: "Succesful login",
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error", error);
        res.status(500).json({message: "Server error"});
    }
})

app.listen(8080, () => {
    console.log("Server started on port 8080")
})

