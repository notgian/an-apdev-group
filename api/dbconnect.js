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
        const atlas_host = process.env.MONGO_ATLAS_HOST
        const atlas_pass = process.env.MONGO_ATLAS_PASS


        // const connection_uri = `mongodb://${user}:${pass}@mongodb:27017/${db}?authSource=${db}`
        const connection_uri = (process.env.ENVIRONMENT == "dev") ? 
            `mongodb://${user}:${pass}@mongodb:27017/${db}?authSource=${db}` :  // old connection string for local instance
            `mongodb+srv://${user}:${atlas_pass}@${atlas_host}/${db}` ;  // atlas connection for prod. Please ask Gian for help making this work

        console.log(connection_uri)

        await mongoose.connect(connection_uri);
        console.log("Connected to database.")
    } catch (err) {
        console.error("Database connection error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
