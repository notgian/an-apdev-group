const express = require('express')
const http = require ('http')
const mongoose = require('mongoose')

const connectDB = require('./dbconnect')

const port = process.env.API_PORT
const app = express()


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

