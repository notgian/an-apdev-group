const express = require('express');
const qs = require('node:querystring'); 
const bodyParser = require('body-parser');
const httpStatus = require('http-status-codes').StatusCodes;
const bcrypt = require('bcrypt')
const { default: mongoose } = require('mongoose');
const Busboy = require('busboy');
const FormData = require('form-data');
const axios = require('axios');
const multer = require('multer')
const fs = require('fs');
const path = require('path');

const router = express.Router();
const User = require('../schema_models/userSchema.js');
const Reviews = require('../schema_models/reviewSchema.js');

// body parser stuffs
const urlencodedParser = bodyParser.urlencoded({extended: true})

// multer for uploading files
const MEDIA_PATH = '/app/data/media'

// For file uploading
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        if (!fs.existsSync(MEDIA_PATH))
            fs.mkdirSync(MEDIA_PATH);
        callback(null, MEDIA_PATH);
    },
    filename: (req, file, callback) => {
        callback(null, `${file.fieldname}_${file.originalname}` );
    }
});

const MAX_FILESIZE_MB = 5;

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

        console.log(req.method == 'POST')
        console.log(path.join(MEDIA_PATH, file.originalname))

        if (mimetype && extname)
            return callback(null, true);
        callback(new Error(`Unsupported file type. Supposed filetypes are ${allowedFiletypes.join(', ')}`), false);
    }
});


// Boilerplate code is AI generated. Will replace with actual code once db is made.
// All routes in this file will be accessed via /api/v1/users


// GET Users
router.get('/', async (req, res) => {
    var OFFSET = 0;
    var COUNT = 20;
    var ORDERBY = 'joindate';

    const orderbyValues = [
        'name',
        'joindate',
        'followers',
        'reviews', // review count
    ];

    if ('offset' in req.query) {
        let offsetNum = Number(req.query.offset);
        if (!isNaN(offsetNum))
            OFFSET = offsetNum;
        else {
            res.send({
                status: httpStatus.BAD_REQUEST,
                message: "Malformed Query. The offset parameter must be a valid number.",
                data: null
            });
            return;
        }

        if (OFFSET < 0) {
            res.send({
                status: httpStatus.BAD_REQUEST,
                message: "Malformed Query. The offset parameter must be greater than 0.",
                data: null
            });
            return;
        }
    } 
    if ('count' in req.query) {
        let countNum = Number(req.query.count);
        if (!isNaN(countNum)) 
            COUNT = countNum;
        else {
            res.send({
                status: httpStatus.BAD_REQUEST,
                message: "Malformed Query. The count parameter must be a valid number.",
                data: null
            });
            return;
        }

        if (COUNT < 1) {
            res.send({
                status: httpStatus.BAD_REQUEST,
                message: "Malformed Query. The count parameter must be greater than 1.",
                data: null
            });
            return;
        }
    }
    if ('orderby' in req.query) {
        let order = req.query.orderby;
        if (orderbyValues.includes(order)) 
            ORDERBY = order;
        else {
            res.send({
                status: httpStatus.BAD_REQUEST,
                message: `Malformed Query. The orderby value '${order}' is invalid.`,
                data: null
            });
            return;
        }
    }

    let query = User.find({})
        .select('-password')
        .skip(OFFSET)       
        .limit(COUNT)
        .lean();

    if (ORDERBY == 'joindate') 
        query.sort({createdAt: -1})
    else if (ORDERBY == 'name') 
        query.sort({username: 1})
    // else if (ORDERBY == 'reviews') return
    // else if (ORDERBY == 'followers') return
    // TODO: add sorting by other means
    else
        query.sort({createdAt: -1})
    let foundUsers = await query.exec()

    res.send({
        status: httpStatus.OK,
        message: "OK",
        data: foundUsers 

    })
});

// GET a specific user by ID
router.get('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        new mongoose.Types.ObjectId(userId)
    }
    catch (err) {
        res.send({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    let query = User.find({_id:userId})
        .select('-password')
        .lean();

    const foundUser = await query.exec()

    if (foundUser.length > 0) {
        res.send({
            status: httpStatus.OK,
            message: "OK",
            data: foundUser
        });
    } 
    else {
        res.send({
            status: httpStatus.NOT_FOUND,
            message: `User with id '${userId}' not found.`,
            data: null
        });
    }

});

// POST to create a new user
router.post('/', urlencodedParser, async (req, res) => {
    const username = req.body.username || false
    const password = req.body.password || false
    const description = ''
    const role = 'user'

    if (!username || !password) {
        let missing = ''
        if (!username && !password)
            missing = 'username & password'
        else if (!username)
            missing = 'username'
        else if (!password)
            missing = 'password'
        res.send({
            status: httpStatus.BAD_REQUEST,
            message: `Missing fields: ${missing}`,
            data: null
        });
        return
    }

    // Check for username conflicts
    let userCheck = await User.find({username:username})
    if (userCheck.length > 0) {
        res.send({
            status: httpStatus.CONFLICT,
            message: `Username ${username} is already in use`,
            data: null
        });
        return;
    }

    // 422 for special business rules
    // not putting anything here, can add if needed but 
    // we don't have any business rules for this I think

    // create user here 
    const saltRounds = 10;
    const hashedPass = bcrypt.hashSync(password, saltRounds);
    try {
        await User.create({
            username: username,
            password: hashedPass,
            description: description,
            role: role
        });     

        let query = User.find({username: username})
            .select('-password')
            .lean();

        const createdUser = await query.exec()

        res.send({
            status: httpStatus.CREATED,
            message: 'User created successfully.',
            data: createdUser
        });
    }
    catch (err) {
        res.send({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: `An error was encountered in creating the user. ${err.message}`,
            data: null
        });
    }

});

// PATCH to modify user data
// TODO: Requires authentication tokens
router.patch("/:id", upload.single('avatar'), async (req, res) => {
    // Authenticate user here
    // TODO If user is not authenticated, return
    let authenticated = true;
    if (!authenticated) {
        res.send({
            status: httpStatus.FORBIDDEN,
            message: `You are not authorized to make this request.`,
            data: null
        });
        return;
    }

    // Verify id format
    const userId = req.params.id;
    try {
        new mongoose.Types.ObjectId(userId)
    }
    catch (err) {
        return res.send({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    // Verify user exists
    let usrqry = User.find({_id:userId})
        .select('-password')
        .lean();
    const foundUser = await usrqry.exec()
    if (foundUser.length < 1) {
        return res.send({
            status: httpStatus.NOT_FOUND,
            message: `User with id '${userId}' not found.`,
            data: null
        });
    } 

    // Initialize update object
    let updates = {}

    // Field Validation
    const editableFields = [
        'name',
        'desc',
    ];

    for (let key of Object.keys(req.body)) {
        if (!editableFields.includes(key)) {
            return res.send({
                status: httpStatus.BAD_REQUEST,
                message: `Cannot modify the property '${key}' of user. Either the property cannot be modified or the property does not exist.`,
                data: null
            });
        }
    }

    if (req.body['name'] && req.body['name'] != '')
        updates['username'] = req.body['name']
    if (req.body['desc'] && req.body['desc'] != '')
        updates['description'] = req.body['desc']

    // Attempt to upload the file
    if (req.file) {
        const filename = `${req.file.fieldname}_${req.file.originalname}`
        updates['avatar'] = `http://${process.env.API_PUBLIC_HOSTNAME}:${process.env.API_PORT}/cdn/${filename}`
    }

    // Update the entry of the user here
    let user = await User.findByIdAndUpdate(userId, updates)

    // Success
    res.send({
        status: httpStatus.ACCEPTED,
        message: `Userdata of ${req.params.id} modified`,
        data: user
    })
}, (err, req, res, next) => {
    if (err) {
        console.log(err)
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Error encountered in uploading file. ${err}.`,
            data: null
        });
    }
    next();
});

// TODO GET REVIEWS BY USER
router.get("/reviews/:id", async (req, res) => {
    const userId = req.params.id;

    try {
        new mongoose.Types.ObjectId(userId)
    }
    catch (err) {
        res.send({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    let query = User.find({_id:userId})
        .select('-password')
        .lean();

    const foundUser = await query.exec()

    if (foundUser.length > 0) {
        let qry = {userId: req.params.id}
        // OPTIONAL restaurant filter
        if ('rstid' in req.query) {
            qry['restaurantId'] = req.query.rstid;
        }
        // Find and return their reviews
        try {
            const reviews = await Reviews.find(qry).lean()

            res.send({
                status: httpStatus.OK,
                message: `OK`,
                data: reviews
            }) ;
        } 
        catch (err) {
            res.send({
                status: httpStatus.INTERNAL_SERVER_ERROR,
                message: `Could not fetch user reviews ${err.message}`,
                data: null
            }) ;
        }
    } else {
        res.send({
            status: httpStatus.NOT_FOUND,
            message: `The user does not exist!`,
            data: null
        }) ;
        return;
    }
    var userFound = true
});

// TODO USER CREATES REVIEW
// TODO: Requires authentication tokens

// TODO USER UPDATES REVIEW
// TODO: Requires authentication tokens

// TODO USER DELETES REVIEW
// TODO: Requires authentication tokens

// TODO OWNER CREATES REPLY
// TODO: Requires authentication tokens

// TODO OWNER UPADTES REPLY
// TODO: Requires authentication tokens

// TODDO OWNER DELETES REPLY
// TODO: Requires authentication tokens

// TODO MARK HELPFUL
// TODO: Requires authentication tokens

// TODO MARK UNHELPFUL
// TODO: Requires authentication tokens

// TODO UNMARK HELPFUL/UNHELPFUL
// TODO: Requires authentication tokens

// TODO FOLLOW
// TODO: Requires authentication tokens

// TODO UNFOLLOW
// TODO: Requires authentication tokens

// TODO LOGIN
// SHALL RETURN JWT TOKEN

// Batch get info of multiple users
// router.post( '/batch',async (req, res) => {
    //     const { ids, fields } = req.body;
    //
        //     if (!ids || !Array.isArray(ids) || ids.length === 0) {
            //         return res.send(
                //             { 
                    //                 status: httpStatus.BAD_REQUEST,
                    //                 message: "Please provide an array of User IDs." 
                    //             });
            //     }
    //
        //     // Get the list of users from db
    //     // TODO: this
    //     return res.send({
        //         status: httpStatus.OK,
        //         message: "OK",
        //         data: {
            //             count: 0,
            //             users: ["Will include code for this in the future once database exists"]
            //         }
        //     });
    // });

// DELETE to delete user
// Contemplating if we should have this because it's not a feature we NEED


module.exports = router;
