const mongoose = require('mongoose');

async function connectDB() {
    try {
        // Check if already connected
        if (mongoose.connection.readyState >= 1) 
            return;
        
        const user = process.env.APP_USER
        const pass = process.env.APP_PASS
        const db = process.env.APP_DB
        const hostname = process.env.MONGODB_HOSTNAME

        const connection_uri = `mongodb://${user}:${pass}@mongodb:27017/${db}?authSource=${db}`

        await mongoose.connect(connection_uri);
        console.log("Connected to database.")
    } catch (err) {
        console.error("Database connection error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
