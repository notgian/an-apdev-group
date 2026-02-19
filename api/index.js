const express = require('express')
const http = require ('http')

const port = process.env.API_PORT
const app = express()

// Import routes
const userRoutes = require('./routes/users.js')

// Routing for all API v1 stuff
const apiRouterV1 = express.Router()

apiRouterV1.use('/users', userRoutes)
// apiRouterV1.use() ...

app.use('/api/v1', apiRouterV1) 

// Manual routing of stuff here if you want something to happen in the root route of the server ig
app.route('/')
    .get( (req, res) => {
        res.send({"data": "serverdata"})
    })

app.listen(port)

