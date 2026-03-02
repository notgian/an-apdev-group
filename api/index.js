const express = require('express')
const http = require ('http')
const mongoose = require('mongoose')

const port = process.env.API_PORT
const app = express()

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

// Initializes and caches the connection
connectDB();

// Import routes
const userRoutes = require('./routes/users.js')

// Routing for all API v1 stuff
const apiRouterV1 = express.Router()
apiRouterV1.use('/users', userRoutes)
app.use('/api/v1', apiRouterV1) 
// apiRouterV1.use() ...


// Manual routing of stuff here if you want something to happen in the root route of the server ig
app.use( ( req, res, next ) => {
  res.status( 404 ).sendStatus(404);
});

app.listen(port)

