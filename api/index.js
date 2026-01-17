const express = require('express')
const http = require ('http')

const port = process.env.API_PORT
const app = express()

app.route('/')
    .get( (req, res) => {
        res.send({"data": "serverdata"})
    })

app.listen(port)

