require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js")

const authRoutes = require("./routes/authRoutes.js")
const mediaRoutes = require("./routes/mediaRoutes.js")
const userRoutes = require("./routes/userRoutes.js");
const listRoutes = require("./routes/listRoutes");
const friendRoutes = require("./routes/friendRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

connectDB()

const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use("/api", authRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/users", userRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);

app.listen(8080, () => {
    console.log("Server started on port 8080")
})

