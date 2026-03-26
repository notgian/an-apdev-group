const express = require('express');
const http = require ('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const connectDB = require('./dbconnect')

const port = process.env.API_PORT
const app = express()
app.use(express.json())

// Initializes and caches the connection
connectDB();

// Import routes
const userRoutes = require('./routes/users.js')
const restaurantRoutes = require('./routes/establishments.js')
const cdnRoutes = require('./routes/cdn.js')
const { authRoutes } = require('./routes/auth.js')

// Routing for all API v1 stuff
const apiRouterV1 = express.Router();
apiRouterV1.use('/users', userRoutes);
apiRouterV1.use('/establishments', restaurantRoutes);
apiRouterV1.use('/auth', authRoutes);
app.use('/api/v1', apiRouterV1);
app.use(express.json())

app.use('/cdn', cdnRoutes)

// Manual routing of stuff here if you want something to happen in the root route of the server ig
app.use( ( req, res, next ) => {
    res.status( 404 ).send({
        status: 404,
        message: '404 page not found.',
        data: null
  });
});

app.listen(port)

