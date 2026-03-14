require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js")

const authRoutes = require("./routes/authRoutes.js")
const mediaRoutes = require("./routes/mediaRoutes.js")

const app = express();

connectDB()

const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));
app.use(express.json())

app.use("/api", authRoutes);
app.use("/api/media", mediaRoutes);


app.listen(8080, () => {
    console.log("Server started on port 8080")
})

