const express = require('express');
const qs = require('node:querystring'); 
const httpStatus = require('http-status-codes').StatusCodes
const path = require('path');

const router = express.Router();

// Yeah im hardcoding this im kinda lazy so DO NOT change the volumes in the docker compose files plsplspls
const MEDIA_PATH = '/app/data/media'

router.get('/', (req, res) => {
    res.send('You might have forgotten to supply a filename, silly!')
})

router.get('/:filename', (req, res) => {
    const fileName = req.params.filename;
    const options = {
        root: MEDIA_PATH,
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true,
            'Cache-Control': 'public, max-age=2592000', 
            'Access-Control-Allow-Origin': '*' 
        }
    };

    res.sendFile(fileName, options, (err) => {
        if (err) {
            res.status(404).json({ error: "Resource not found" });
        }
    });})

module.exports = router;
