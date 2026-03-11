const express = require('express');
const qs = require('node:querystring'); 
const httpStatus = require('http-status-codes').StatusCodes
const multer = require('multer')
const path = require('path');
const fs = require('fs')

const router = express.Router();

// Yeah im hardcoding this im kinda lazy so DO NOT change the volumes in the docker compose files plsplspls
const MEDIA_PATH = '/app/data/media'

// For file uploading
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        if (!fs.existsSync(MEDIA_PATH))
            fs.mkdirSync(MEDIA_PATH);
        callback(null, MEDIA_PATH);
    },
    filename: (req, file, callback) => {
        callback(null, `profile-${file.fieldname + path.extname(file.originalname)}` );
    }
});

const MAX_FILESIZE_MB = 100;

const upload = multer({ 
    storage: storage,
    limits: { fileSize: MAX_FILESIZE_MB * 1024 * 1024 }, 
    fileFilter: (req, file, callback) => {
        const allowedFiletypes = [
            'jpeg', 'jpg',
            'png',
            'mp4', 'mov', 'avi', 'mkv'
        ]
        const filetypesRegEx = RegExp(allowedFiletypes.join('|'), 'i')
        const mimetype = filetypesRegEx.test(file.mimetype);
        const extname = filetypesRegEx.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname)
            return callback(null, true);
        callback(new Error(`Unsupported file type. Supposed filetypes are ${allowedFiletypes.join(', ')}`), false);
    }
});

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
    });
});

// For uploading files, does not overwrite
router.post('/', upload.single('file'), (req, res) => {
    console.log('cdn upload attempt!')
    try {
        if (!req.file)
            return res.send({
                status: httpStatus.BAD_REQUEST,
                message: 'No file received.',
                data: null
            });

        return res.send({
            status: httpStatus.OK,
            message: 'Media uploaded successfuly.',
            data: null
        });

    } catch (error) {
        return res.send({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: `Internal error encountered. ${error.message}.`,
            data: null
        });
    }
}, (err, req, res, next) => {
    if (err) {
        return res.send({
            status: httpStatus.BAD_REQUEST,
            message: `Error encountered in uploading file. ${err}.`,
            data: null
        });
    }
    next();
});

// For uploading files, overwrite
router.put('/', (req, res) => {

});


module.exports = router;
