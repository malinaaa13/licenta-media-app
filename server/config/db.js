const mongoose = require("mongoose");

// Creăm o funcție asincronă pentru conectare
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectat cu succes la MongoDB!");
    } catch (error) {
        console.error("❌ Eroare la conectarea cu MongoDB:", error);
        // Dacă baza de date pică, oprim de tot serverul (eroare fatală)
        process.exit(1); 
    }
};

module.exports = connectDB;