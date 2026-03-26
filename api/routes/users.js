const express = require('express');
const qs = require('node:querystring'); 
const bodyParser = require('body-parser');
const httpStatus = require('http-status-codes').StatusCodes;
const bcrypt = require('bcrypt')
const { default: mongoose } = require('mongoose');
const FormData = require('form-data');
const axios = require('axios');
const multer = require('multer')
const fs = require('fs');
const path = require('path');
const bcrpyt = require('bcrypt')

const router = express.Router();
const User = require('../schema_models/userSchema.js');
const Restaurant = require('../schema_models/restaurantSchema.js')
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

const MAX_FILESIZE_AVATAR_MB = 5;
const MAX_FILESIZE_MEDIA_MB = 25;

const uploadAvatar = multer({ 
    storage: storage,
    limits: { fileSize: MAX_FILESIZE_AVATAR_MB * 1024 * 1024 }, 
    fileFilter: (req, file, callback) => {
        const allowedFiletypes = [
            'jpeg', 'jpg',
            'png',
        ]
        const filetypesRegEx = RegExp(allowedFiletypes.join('|'), 'i')
        const mimetype = filetypesRegEx.test(file.mimetype);
        const extname = filetypesRegEx.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname)
            return callback(null, true);
        callback(new Error(`Unsupported file type. Supposed filetypes are ${allowedFiletypes.join(', ')}`), false);
    }
});

const uploadMedia = multer({ 
    storage: storage,
    limits: { fileSize: MAX_FILESIZE_MEDIA_MB * 1024 * 1024 }, 
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

/**
 * @route   GET /
 * @desc    Retrieve a paginated list of users with optional search and sorting.
 * @access  Public
 * @query   {number} offset - Number of records to skip.
 * @query   {number} count - Number of records to return.
 * @query   {string} orderby - Field to sort by (name, joindate, followers, reviews).
 * @query   {string} search - Search string for usernames.
 * @returns {object} 200 - OK with an array of user objects.
 * @returns {object} 400 - Malformed Query (invalid number format or values).
 */
// GET Users
router.get('/', async (req, res) => {
    var OFFSET = 0;
    var COUNT = 20;
    var ORDERBY = 'joindate';
    var SEARCH = null;

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
            res.status(httpStatus.BAD_REQUEST).json({
                status: httpStatus.BAD_REQUEST,
                message: "Malformed Query. The offset parameter must be a valid number.",
                data: null
            });
            return;
        }

        if (OFFSET < 0) {
            res.status(httpStatus.BAD_REQUEST).json({
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
            res.status(httpStatus.BAD_REQUEST).json({
                status: httpStatus.BAD_REQUEST,
                message: "Malformed Query. The count parameter must be a valid number.",
                data: null
            });
            return;
        }

        if (COUNT < 1) {
            res.status(httpStatus.BAD_REQUEST).json({
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
            res.status(httpStatus.BAD_REQUEST).json({
                status: httpStatus.BAD_REQUEST,
                message: `Malformed Query. The orderby value '${order}' is invalid.`,
                data: null
            });
            return;
        }
    }

    let queryObj = {}
    if ('search' in req.query) {
        SEARCH = req.query.search
        // queryObj['$text'] = {$search: SEARCH}
        queryObj['username'] = {$regex: `.*${SEARCH}.*`, $options: 'i'}
    }
    let query = User.find(queryObj)
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

    res.status(httpStatus.OK).json({
        status: httpStatus.OK,
        message: "OK",
        data: foundUsers 

    })
});

/**
 * @route   GET /:id
 * @desc    Retrieve details of a single user by their MongoDB ID.
 * @access  Public
 * @params  {string} id - The unique identifier of the user.
 * @returns {object} 200 - OK with the user object.
 * @returns {object} 400 - Invalid ID format.
 * @returns {object} 404 - User not found.
 */
// GET a specific user by ID
router.get('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        new mongoose.Types.ObjectId(userId)
    }
    catch (err) {
        res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    let query = User.findOne({_id:userId})
        .select('-password')
        .lean();

    const foundUser = await query.exec()

    if (foundUser != null) {
        res.status(httpStatus.OK).json({
            status: httpStatus.OK,
            message: "OK",
            data: foundUser
        });
    } 
    else {
        res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User with id '${userId}' not found.`,
            data: null
        });
    }

});

/**
 * @route   POST /
 * @desc    Create a new user account with hashed password.
 * @access  Public
 * @body    {string} username - Desired username.
 * @body    {string} password - User password.
 * @returns {object} 201 - User created successfully with user data.
 * @returns {object} 400 - Missing username or password.
 * @returns {object} 409 - Username conflict.
 * @returns {object} 500 - Internal server error.
 */
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
        res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Missing fields: ${missing}`,
            data: null
        });
        return
    }

    // Check for username conflicts
    let userCheck = await User.find({username:username})
    if (userCheck.length > 0) {
        res.status(httpStatus.CONFLICT).json({
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

        res.status(httpStatus.CREATED).json({
            status: httpStatus.CREATED,
            message: 'User created successfully.',
            data: createdUser
        });
    }
    catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: `An error was encountered in creating the user. ${err.message}`,
            data: null
        });
    }

});

/**
 * @route   PATCH /:id
 * @desc    Modify existing user information and/or update avatar.
 * @access  Private
 * @params  {string} id - The user ID to update.
 * @body    {string} [name] - New username.
 * @body    {string} [desc] - New user description.
 * @file    {object} [avatar] - Image file for the user profile.
 * @returns {object} 202 - Accepted, with the updated user data.
 * @returns {object} 400 - Invalid ID format or unauthorized field modification.
 * @returns {object} 403 - Forbidden (unauthorized access).
 * @returns {object} 404 - User not found.
 */
// PATCH to modify user data
// TODO: Requires authentication tokens
router.patch("/:id", uploadAvatar.single('avatar'), async (req, res) => {
    // Authenticate user here
    // TODO If user is not authenticated, return
    let authenticated = true;
    if (!authenticated) {
        res.status(httpStatus.FORBIDDEN).json({
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
        return res.status(httpStatus.BAD_REQUEST).json({
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
        return res.status(httpStatus.NOT_FOUND).json({
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
            return res.status(httpStatus.BAD_REQUEST).json({
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
    res.status(httpStatus.ACCEPTED).json({
        status: httpStatus.ACCEPTED,
        message: `Userdata of ${req.params.id} modified`,
        data: user
    })
}, (err, req, res, next) => {
    if (err) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Error encountered in uploading file. ${err}.`,
            data: null
        });
    }
    next();
});

/**
 * @route   GET /reviews/:id
 * @desc    Get all reviews posted by a specific user, optionally filtered by restaurant.
 * @access  Public
 * @params  {string} id - The user ID.
 * @query   {string} [rstid] - Optional restaurant ID to filter reviews.
 * @returns {object} 200 - OK with an array of reviews.
 * @returns {object} 400 - Invalid ID format.
 * @returns {object} 404 - User not found.
 * @returns {object} 500 - Internal server error.
 */
router.get("/reviews/:id", async (req, res) => {
    const userId = req.params.id;

    try {
        new mongoose.Types.ObjectId(userId)
    }
    catch (err) {
        res.status(httpStatus.BAD_REQUEST).json({
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
            const reviews = await Reviews.find(qry)
                .populate('restaurantId')
                .lean()

            res.status(httpStatus.OK).json({
                status: httpStatus.OK,
                message: `OK`,
                data: reviews
            }) ;
        } 
        catch (err) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                status: httpStatus.INTERNAL_SERVER_ERROR,
                message: `Could not fetch user reviews ${err.message}`,
                data: null
            }) ;
        }
    } else {
        res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `The user does not exist!`,
            data: null
        }) ;
        return;
    }
    var userFound = true;
});

/**
 * @route   POST /reviews/:userid/:rstrid
 * @desc    Submit a new review for a restaurant, including optional media files.
 * @access  Private
 * @params  {string} userid - The ID of the user reviewing.
 * @params  {string} rstrid - The ID of the restaurant being reviewed.
 * @body    {number} rating - Score (0-5).
 * @body    {string} comment - Text review content.
 * @file    {array} [media] - Array of image or video files.
 * @returns {object} 201 - Created successfully with the new review data.
 * @returns {object} 400 - Invalid ID format or review creation error.
 * @returns {object} 404 - User or Establishment not found.
 * @returns {object} 409 - User has already posted a review for this establishment.
 */
// TODO: Requires authentication tokens
router.post('/reviews/:userid/:rstrid', uploadMedia.array('media') ,async (req, res) => {
    // lowk too lazy to search for the right solution so have this
    async function deleteMedia() {
        for (let file of req.files) {
            await fs.unlink(path.join(MEDIA_PATH, file.filename), (err) => {
                console.log('Could not remove ' + file.filename);
            })
        }
    }

    const userId = req.params.userid;
    const restaurantId = req.params.rstrid;
    
    // Verify ID formats
    try {
        new mongoose.Types.ObjectId(userId);
        new mongoose.Types.ObjectId(restaurantId);
    }
    catch (err) {
        deleteMedia();
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }


    // Verify user and rstr exist
    let queryUser = User.find({_id:userId})
        .select('-password')
        .lean();
    let queryRstr = Restaurant.find({_id:restaurantId})
        .lean();
    const foundUser = await queryUser.exec();
    const foundRstr = await queryRstr.exec();

    if (foundUser.length < 1) {
        deleteMedia();
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User with id ${userId} not found.`,
            data: null
        });
    }
    if (foundRstr.length < 1) {
        deleteMedia();
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Establishment with id ${restaurantId} not found.`,
            data: null
        });
    }

    // Check that the user does not already have a review in that establishment
    let queryIfReviews = await Reviews.find({
        userId: userId,
        restaurantId: restaurantId
    })
        .lean();

    if (queryIfReviews.length > 0) {
        deleteMedia();
        return res.status(httpStatus.CONFLICT).json({
            status: httpStatus.CONFLICT,
            message: `User has already posted a review to the establishment.`,
            data: null
        });
    }
    
    // Convert the uploaded filenames to the 
    let mediaLocations = []
    for (let file of req.files) {
        let loc = `http://${process.env.API_PUBLIC_HOSTNAME}:${process.env.API_PORT}/cdn/${file.filename}`;
        mediaLocations.push(loc);
    }

    // Create the review
    let createObj = {
        userId: userId,
        restaurantId: restaurantId
    }
    createObj['rating'] = req.body['rating'];
    createObj['comment'] = req.body['comment'];
    if (mediaLocations.length > 0)
        createObj['media'] = mediaLocations;

    try {
        const newReview = await Reviews.create(createObj);

        // Update restablishment avg rating
        let qry = { restaurantId: restaurantId }
        const reviewQry = Reviews.find(qry)
            .select('rating')
            .lean();

        const reviews = await reviewQry.exec();

        let totalRatings = newReview.rating;
        let totalRatingsCount = 1;
        for (let review of reviews) {
            totalRatings += review.rating;
            totalRatingsCount++
        }

        let newAvg = (totalRatings / totalRatingsCount).toFixed(2)

        await Restaurant.findOneAndUpdate({_id: restaurantId}, {avgRating: newAvg})

        return res.status(httpStatus.CREATED).json({
            status: httpStatus.CREATED,
            message: `Review created successfully.`,
            data: newReview
        });
    } catch (err) {
        deleteMedia();
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Error encountered in creating the review. ${err}.`,
            data: null
        });
    }
}, (err, req, res, next) => {
    if (err) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Error encountered in uploading media. ${err}.`,
            data: null
        });
    }
    next();
});

/**
 * @route   PUT /reviews/:userid/:rstrid
 * @desc    Update an existing review's rating and comment.
 * @access  Private
 * @params  {string} userid - The ID of the user.
 * @params  {string} rstrid - The ID of the restaurant.
 * @body    {number} rating - New score (0-5).
 * @body    {string} comment - New review text.
 * @returns {object} 200 - Successfully updated review data.
 * @returns {object} 400 - Invalid ID, missing fields, or invalid values.
 * @returns {object} 404 - User, Establishment, or Review not found.
 * @returns {object} 500 - Internal server error during modification.
 */
// TODO: Requires authentication tokens
router.put('/reviews/:userid/:rstrid', async (req, res) => {
    const userId = req.params.userid;
    const restaurantId = req.params.rstrid;
    
    // Verify ID formats
    try {
        new mongoose.Types.ObjectId(userId);
        new mongoose.Types.ObjectId(restaurantId);
    }
    catch (err) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    // Verify user and rstr exist
    let queryUser = User.find({_id:userId})
        .select('-password')
        .lean();
    let queryRstr = Restaurant.find({_id:restaurantId})
        .lean();
    const foundUser = await queryUser.exec();
    const foundRstr = await queryRstr.exec();

    if (foundUser.length < 1) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User with id ${userId} not found.`,
            data: null
        });
    }
    if (foundRstr.length < 1) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Establishment with id ${restaurantId} not found.`,
            data: null
        });
    }

    // Verify review exists
    const foundReview = await Reviews.find({
        userId: userId,
        restaurantId: restaurantId
    })

    if (foundReview.length == 0) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User ${userId} does not have a review on the establishment ${restaurantId}.`,
            data: null
        });
    }

    // Verify rating and description
    const rating = req.body.rating;
    const comment = req.body.comment;

    let missingFields = []
    if (!('rating' in req.body))
        missingFields.push('rating');
    if (!('comment' in req.body))
        missingFields.push('comment');

    if (!('rating' in req.body && 'comment' in req.body)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Missing fields. ${missingFields.join(', ')}`,
            data: null
        });
    }

    if (rating < 0 || rating > 5)
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: 'Invalid rating value. Rating must be between 0 and 5, inclusive.',
            data: null
        });

    if (comment == "")
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: 'Invalid comment value. Comment is an empty string.',
            data: null
        });

    // Modify the review now
    let filter = {userId:userId, restaurantId:restaurantId}
    let updates = {rating: rating, comment: comment, edited: true}
    try {
        let updReview = await Reviews.findOneAndUpdate(filter, updates, {
            returnDocument: 'after',
            lean: true
        });

        // Update restablishment avg rating
        let qry = { restaurantId: restaurantId }
        const reviewQry = Reviews.find(qry)
            .select('rating')
            .lean();

        const reviews = await reviewQry.exec();

        let totalRatings = updReview.rating;
        let totalRatingsCount = 1;
        for (let review of reviews) {
            totalRatings += review.rating;
            totalRatingsCount++
        }

        let newAvg = (totalRatings / totalRatingsCount).toFixed(2)

        await Restaurant.findOneAndUpdate({_id: restaurantId}, {avgRating: newAvg})

        return res.status(httpStatus.OK).json({
            status: httpStatus.OK,
            message: 'Successfully updated review.',
            data: updReview
        });
    }
    catch (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Could not modify the review.',
            data: null
        });
    }
});

/**
 * @route   DELETE /reviews/:userid/:rstrid
 * @desc    Remove a review from the database.
 * @access  Private
 * @params  {string} userid - ID of the user who wrote the review.
 * @params  {string} rstrid - ID of the restaurant reviewed.
 * @returns {object} 200 - Successfully deleted review data.
 * @returns {object} 400 - Invalid ID format.
 * @returns {object} 404 - User, Establishment, or Review not found.
 * @returns {object} 500 - Internal server error during deletion.
 */
// IMPORTANT: DOES NOT CURRENTLY DELETE THE MEIDA ASSOCIATED WITH THE REVIEW
// TODO: Requires authentication tokens
router.delete('/reviews/:userid/:rstrid', async (req, res) => {
    const userId = req.params.userid;
    const restaurantId = req.params.rstrid;
    
    // Verify ID formats
    try {
        new mongoose.Types.ObjectId(userId);
        new mongoose.Types.ObjectId(restaurantId);
    }
    catch (err) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    // Verify user and rstr exist
    let queryUser = User.find({_id:userId})
        .select('-password')
        .lean();
    let queryRstr = Restaurant.find({_id:restaurantId})
        .lean();
    const foundUser = await queryUser.exec();
    const foundRstr = await queryRstr.exec();

    if (foundUser.length < 1) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User with id ${userId} not found.`,
            data: null
        });
    }
    if (foundRstr.length < 1) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Establishment with id ${restaurantId} not found.`,
            data: null
        });
    }

    // Verify review exists
    const foundReview = await Reviews.find({
        userId: userId,
        restaurantId: restaurantId
    })

    if (foundReview.length == 0) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User ${userId} does not have a review on the establishment ${restaurantId}.`,
            data: null
        });
    }

    // Delete the review
    let filter = {userId:userId, restaurantId:restaurantId}
    try {
        let deletedReview = await Reviews.findOneAndDelete(filter, {
            returnDocument: 'after',
            lean: true
        });

        // Update restablishment avg rating
        let qry = { restaurantId: restaurantId }
        const reviewQry = Reviews.find(qry)
            .select('rating')
            .lean();

        let totalRatings = 0;
        let totalRatingsCount = 0;

        const reviews = await reviewQry.exec();
        for (let review of reviews) {
            totalRatings += review.rating;
            totalRatingsCount++
        }

        let newAvg = (totalRatings / totalRatingsCount).toFixed(2)

        await Restaurant.findOneAndUpdate({_id: restaurantId}, {avgRating: newAvg})

        return res.status(httpStatus.OK).json({
            status: httpStatus.OK,
            message: 'Successfully deleted review.',
            data: deletedReview
        });
    }
    catch (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Could not delete the review.',
            data: null
        });
    }
});

/**
 * @route   POST /reviews/owner_response/:ownerid/:userid
 * @desc    Allow a restaurant owner to reply to a user's review.
 * @access  Private (Owner Only)
 * @params  {string} ownerid - ID of the restaurant owner.
 * @params  {string} userid - ID of the user who left the review.
 * @body    {string} comment - The response text.
 * @returns {object} 200 - Responded successfully with updated review data.
 * @returns {object} 400 - Invalid ID, user is not owner, or empty comment.
 * @returns {object} 404 - Owner, User, Establishment, or Review not found.
 * @returns {object} 409 - Owner already has a response to this review.
 */
// TODO: Requires authentication tokens
router.post('/reviews/owner_response/:ownerid/:userid', async (req, res) => {
    const ownerId = req.params.ownerid;
    const userId = req.params.userid;
    
    // Verify ID formats
    try {
        new mongoose.Types.ObjectId(ownerId);
        new mongoose.Types.ObjectId(userId);
    }
    catch (err) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    // Verify body parameters
    const comment = req.body.comment.trim() || null
    if (comment == null || comment == "")
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: 'No comment field or empty comment field.',
            data: null
        });

    // Verify users exist
    let queryOwner = User.findOne({_id:ownerId})
        .select('-password')
        .lean();
    let queryUser = User.findOne({_id:userId})
        .select('-password')
        .lean();
    const foundOwner = await queryOwner.exec();
    const foundUser = await queryUser.exec();

    if (foundOwner == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Owner user with id ${ownerId} not found.`,
            data: null
        });
    } 
    else if (foundOwner.role != 'owner') {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `User with id ${userId} is not an owner.`,
            data: null
        });
    }
    
    if (foundUser == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User with id ${userId} not found.`,
            data: null
        });
    }

    // Get establishment of owner
    const rstrqry = Restaurant.findOne({ownerId: ownerId})
        .lean();
    const foundRstr = await rstrqry.exec();
    if (foundRstr == null)
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Owner ${ownerId} does not own an establishment.`,
            data: null
        });

    // Create the review (which is an update)
    const restaurantId = foundRstr._id;
    const reviewFilter = {
        userId: userId,
        restaurantId: restaurantId
    }

    const foundReview = await Reviews.findOne(reviewFilter, 'ownerResponse') 

    if (foundReview == null)
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User ${userId} does not have a review on the establishment ${restaurantId}.`,
            data: null
        });
    if (foundReview.ownerResponse != undefined)
        return res.status(httpStatus.CONFLICT).json({
            status: httpStatus.CONFLICT,
            message: `Owner ${ownerId} already has a response to the user ${userId}`,
            data: null
        });

    const updateReview = {
        ownerResponse: {
            ownerId: ownerId,
            comment: comment,
            respondedAt: Date.now()
        }
    }
    const updatedReview = await Reviews.findOneAndUpdate(reviewFilter, updateReview, {
        returnDocument: 'after',       
        runValidators: true 
    });
    return res.status(httpStatus.OK).json({
        status: httpStatus.OK,
        message: `Owner ${ownerId} responded to user ${userId} successfully`,
        data: updatedReview
    });
})

/**
 * @route   PUT /reviews/owner_response/:ownerid/:userid
 * @desc    Edit an existing owner response to a review.
 * @access  Private (Owner Only)
 * @params  {string} ownerid - ID of the restaurant owner.
 * @params  {string} userid - ID of the user who left the review.
 * @body    {string} comment - The updated response text.
 * @returns {object} 200 - Responded successfully with updated review data.
 * @returns {object} 400 - Invalid ID, user is not owner, or empty comment.
 * @returns {object} 404 - Owner, User, Establishment, or Review not found.
 */
//TODO: Requires authentication tokens
router.put('/reviews/owner_response/:ownerid/:userid', async (req, res) => {
    const ownerId = req.params.ownerid;
    const userId = req.params.userid;
    
    // Verify ID formats
    try {
        new mongoose.Types.ObjectId(ownerId);
        new mongoose.Types.ObjectId(userId);
    }
    catch (err) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    // Verify body parameters
    const comment = req.body.comment.trim() || null
    if (comment == null || comment == "")
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: 'No comment field or empty comment field.',
            data: null
        });

    // Verify users exist
    let queryOwner = User.findOne({_id:ownerId})
        .select('-password')
        .lean();
    let queryUser = User.findOne({_id:userId})
        .select('-password')
        .lean();
    const foundOwner = await queryOwner.exec();
    const foundUser = await queryUser.exec();

    if (foundOwner == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Owner user with id ${ownerId} not found.`,
            data: null
        });
    } 
    else if (foundOwner.role != 'owner') {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `User with id ${userId} is not an owner.`,
            data: null
        });
    }
    
    if (foundUser == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User with id ${userId} not found.`,
            data: null
        });
    }

    // Get establishment of owner
    const rstrqry = Restaurant.findOne({ownerId: ownerId})
        .lean();
    const foundRstr = await rstrqry.exec();
    if (foundRstr == null)
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Owner ${ownerId} does not own an establishment.`,
            data: null
        });

    // Update the review
    const restaurantId = foundRstr._id;
    const reviewFilter = {
        userId: userId,
        restaurantId: restaurantId
    }

    const foundReview = await Reviews.findOne(reviewFilter, 'ownerResponse') 

    if (foundReview == null)
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User ${userId} does not have a review on the establishment ${restaurantId}.`,
            data: null
        });

    const updateReview = {
        ownerResponse: {
            ownerId: ownerId,
            comment: comment,
            respondedAt: foundReview.ownerResponse.respondedAt
        }
    }
    const updatedReview = await Reviews.findOneAndUpdate(reviewFilter, updateReview, {
        returnDocument: 'after',       
        runValidators: true 
    });
    return res.status(httpStatus.OK).json({
        status: httpStatus.OK,
        message: `Ower ${ownerId} response to user ${userId} updated successfully`,
        data: updatedReview
    });
})

/**
 * @route   DELETE /reviews/owner_response/:ownerid/:userid
 * @desc    Deletes an owner's response to a specific user's review.
 * @access  Private (Requires Authentication)
 * @param   {string} ownerid - The ID of the restaurant owner.
 * @param   {string} userid - The ID of the user who wrote the review.
 * @returns {object} 200 - Success message and updated review data.
 * @returns {object} 400 - Invalid ID format or user is not an owner.
 * @returns {object} 404 - Owner, User, Restaurant, or Review not found.
 * @returns {object} 409 - Owner has not responded to this review.
 */
// TODO: Requires authentication tokens
router.delete('/reviews/owner_response/:ownerid/:userid', async (req, res) => {
    const ownerId = req.params.ownerid;
    const userId = req.params.userid;
    
    // Verify ID formats
    try {
        new mongoose.Types.ObjectId(ownerId);
        new mongoose.Types.ObjectId(userId);
    }
    catch (err) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    // Verify users exist
    let queryOwner = User.findOne({_id:ownerId})
        .select('-password')
        .lean();
    let queryUser = User.findOne({_id:userId})
        .select('-password')
        .lean();
    const foundOwner = await queryOwner.exec();
    const foundUser = await queryUser.exec();

    if (foundOwner == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Owner user with id ${ownerId} not found.`,
            data: null
        });
    } 
    else if (foundOwner.role != 'owner') {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `User with id ${userId} is not an owner.`,
            data: null
        });
    }
    
    if (foundUser == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User with id ${userId} not found.`,
            data: null
        });
    }

    // Get establishment of owner
    const rstrqry = Restaurant.findOne({ownerId: ownerId})
        .lean();
    const foundRstr = await rstrqry.exec();
    if (foundRstr == null)
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Owner ${ownerId} does not own an establishment.`,
            data: null
        });

    // Verify review and response exist.
    const restaurantId = foundRstr._id;
    const reviewFilter = {
        userId: userId,
        restaurantId: restaurantId
    }

    const foundReview = await Reviews.findOne(reviewFilter, 'ownerResponse') 

    if (foundReview == null)
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User ${userId} does not have a review on the establishment ${restaurantId}.`,
            data: null
        });
    if (foundReview.ownerResponse == undefined)
        return res.status(httpStatus.CONFLICT).json({
            status: httpStatus.CONFLICT,
            message: `Owner ${ownerId} does not have a response to user ${userId}`,
            data: null
        });
    
    // Update review to delete
    const updateReview = {
        ownerResponse: null
    }
    const updatedReview = await Reviews.findOneAndUpdate(reviewFilter, updateReview, {
        returnDocument: 'after',       
        runValidators: true 
    });

    return res.status(httpStatus.OK).json({
        status: httpStatus.OK,
        message: `Owner ${ownerId} response to user ${userId} deleted successfully`,
        data: updatedReview
    });
});

/**
 * @route   POST /:userid/helpful/:reviewid
 * @desc    Marks a review as helpful. If already marked helpful, it unmarks it. 
 * If previously marked unhelpful, it switches the vote.
 * @access  Private (Requires Authentication)
 * @param   {string} userid - The ID of the voting user.
 * @param   {string} reviewid - The ID of the review being voted on.
 * @returns {object} 200 - Success message and updated review.
 * @returns {object} 404 - User or Review not found.
 * @returns {object} 500 - Internal server error during update.
 */
// TODO: Requires authentication tokens
router.post('/:userid/helpful/:reviewid', async (req, res) => {
    const userId = req.params.userid;
    const reviewId = req.params.reviewid;
    
    // Verify ID formats
    try {
        new mongoose.Types.ObjectId(userId);
        new mongoose.Types.ObjectId(reviewId);
    }
    catch (err) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    // Verify users exist
    let queryUser = User.findOne({_id:userId})
        .select('-password')
        .lean();
    let queryReview = Reviews.findOne({_id:reviewId})
        .lean();

    const foundUser = await queryUser.exec();
    const foundReview = await queryReview.exec();

    if (foundUser == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User with id ${userId} not found.`,
            data: null
        });
    } 

    if (foundReview == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Review with id ${reviewId} not found.`,
            data: null
        });
    } 

    const markedHelpful = foundReview.helpfulVotes.some(id => id == userId)
    const markedUnhelpful = foundReview.unhelpfulVotes.some(id => id == userId)

    let newHelpful = foundReview.helpfulVotes
    let newHelpfulCount = foundReview.helpfulCount
    let newUnhelpful = foundReview.unhelpfulVotes
    let newUnhelpfulCount = foundReview.unhelpfulCount

    // Unmark instead if already marked as helpful
    if (markedHelpful) {
        newHelpful = newHelpful.filter(i => i!=userId);
        newHelpfulCount--;
    } 
    // Update review to record and mark it as helpful
    else {
        if (markedUnhelpful) {
            newUnhelpful = newUnhelpful.filter(i => i!=userId);
            newUnhelpfulCount--
        }

        newHelpful = newHelpful.concat(new mongoose.Types.ObjectId(userId))
        newHelpfulCount++;
    }

    try {
        const updatedReview = await Reviews.findOneAndUpdate({_id:reviewId}, {
            unhelpfulVotes: newUnhelpful,
            unhelpfulCount: newUnhelpfulCount,
            helpfulVotes: newHelpful,
            helpfulCount: newHelpfulCount
        }, {
            returnDocument: 'after',
            lean: true
        });

        return res.status(httpStatus.OK).json({
            status: httpStatus.OK,
            message: `Review successfully marked helpful.`,
            data: updatedReview
        });
    }
    catch (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: `Could not mark review as helpful. ${err}`,
            data: null
        });
        
    }
})

/**
 * @route   POST /:userid/unhelpful/:reviewid
 * @desc    Marks a review as unhelpful. If already marked unhelpful, it unmarks it.
 * If previously marked helpful, it switches the vote.
 * @access  Private (Requires Authentication)
 * @param   {string} userid - The ID of the voting user.
 * @param   {string} reviewid - The ID of the review being voted on.
 */
// TODO: Requires authentication tokens
router.post('/:userid/unhelpful/:reviewid', async (req, res) => {
    const userId = req.params.userid;
    const reviewId = req.params.reviewid;
    
    // Verify ID formats
    try {
        new mongoose.Types.ObjectId(userId);
        new mongoose.Types.ObjectId(reviewId);
    }
    catch (err) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    // Verify users exist
    let queryUser = User.findOne({_id:userId})
        .select('-password')
        .lean();
    let queryReview = Reviews.findOne({_id:reviewId})
        .lean();

    const foundUser = await queryUser.exec();
    const foundReview = await queryReview.exec();


    if (foundUser == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User with id ${userId} not found.`,
            data: null
        });
    } 

    if (foundReview == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Review with id ${reviewId} not found.`,
            data: null
        });
    } 

    const markedHelpful = foundReview.helpfulVotes.some(id => id == userId)
    const markedUnhelpful = foundReview.unhelpfulVotes.some(id => id == userId)

    // Check if already marked as helpful
    let newHelpful = foundReview.helpfulVotes
    let newHelpfulCount = foundReview.helpfulCount
    let newUnhelpful = foundReview.unhelpfulVotes
    let newUnhelpfulCount = foundReview.unhelpfulCount

    // Unmark instead if already marked as unhelpful
    if (markedUnhelpful) {
        newUnhelpful = newHelpful.filter(i => i!=userId);
        newUnhelpfulCount--;
    } 
    // Update review to record and mark it as unhelpful
    else {
        if (markedHelpful) {
            newHelpful = newHelpful.filter(i => i!=userId);
            newHelpfulCount--
        }

        newUnhelpful = newUnhelpful.concat(new mongoose.Types.ObjectId(userId))
        newUnhelpfulCount++;
    }

    try {
        const updatedReview = await Reviews.findOneAndUpdate({_id:reviewId}, {
            helpfulVotes: newHelpful,
            helpfulCount: newHelpfulCount,

            unhelpfulVotes: newUnhelpful,
            unhelpfulCount: newUnhelpfulCount
        }, {
            returnDocument: 'after',
            lean: true
        });

        return res.status(httpStatus.OK).json({
            status: httpStatus.OK,
            message: `Review successfully marked unhelpful.`,
            data: updatedReview
        });
    }
    catch (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: `Could not mark review as unhelpful. ${err}`,
            data: null
        });
        
    }
})

/**
 * @route   POST /:userid/unmark/:reviewid
 * @desc    Removes any existing helpful or unhelpful votes from a review for a specific user.
 * @access  Private (Requires Authentication)
 * @param   {string} userid - The ID of the user unmarking the review.
 * @param   {string} reviewid - The ID of the review to be unmarked.
 * @returns {object} 409 - If user has not previously marked the review.
 */
// TODO: Requires authentication tokens
router.post('/:userid/unmark/:reviewid', async (req, res) => {
    const userId = req.params.userid;
    const reviewId = req.params.reviewid;
    
    // Verify ID formats
    try {
        new mongoose.Types.ObjectId(userId);
        new mongoose.Types.ObjectId(reviewId);
    }
    catch (err) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    // Verify users exist
    let queryUser = User.findOne({_id:userId})
        .select('-password')
        .lean();
    let queryReview = Reviews.findOne({_id:reviewId})
        .lean();

    const foundUser = await queryUser.exec();
    const foundReview = await queryReview.exec();

    if (foundUser == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `User with id ${userId} not found.`,
            data: null
        });
    } 

    if (foundReview == null) {
        return res.status(httpStatus.NOT_FOUND).json({
            status: httpStatus.NOT_FOUND,
            message: `Review with id ${reviewId} not found.`,
            data: null
        });
    } 
    

    // get updated helpful or unhelpful counts
    const markedHelpful = foundReview.helpfulVotes.some(id => id == userId)
    let newHelpful = foundReview.helpfulVotes
    let newHelpfulCount = foundReview.helpfulCount
    if (markedHelpful) {
        newHelpful = newHelpful.filter(i => i!=userId);
        newHelpfulCount--
    }

    const markedUnhelpful = foundReview.unhelpfulVotes.some(id => id == userId)
    let newUnhelpful = foundReview.unhelpfulVotes
    let newUnhelpfulCount = foundReview.unhelpfulCount
    if (markedUnhelpful) {
        newUnhelpful = newUnhelpful.filter(i => i!=userId);
        newUnhelpfulCount--
    }

    if (markedHelpful) {
        newHelpful = newHelpful.filter(i => i!=userId);
        newHelpfulCount = newHelpfulCount--
    }

    if (!markedHelpful && !markedUnhelpful)
        return res.status(httpStatus.CONFLICT).json({
            status: httpStatus.CONFLICT,
            message: `User has not marked review either helpful nor unhelpful.`,
            data: null
        });

    try {
        const updatedReview = await Reviews.findOneAndUpdate({_id:reviewId}, {
            helpfulVotes: newHelpful,
            helpfulCount: newHelpfulCount,
            unhelpfulVotes: newUnhelpful,
            unhelpfulCount: newUnhelpfulCount,
        }, {
            returnDocument: 'after',
            lean: true
        });

        return res.status(httpStatus.OK).json({
            status: httpStatus.OK,
            message: `Review successfully unmarked.`,
            data: updatedReview
        });
    }
    catch (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: `Could not unmark review. ${err}`,
            data: null
        });
        
    }
})

// TODO FOLLOW
// TODO: Requires authentication tokens
router.post('/follow/:otherId', async (req, res) => {
    const userId = req.body.userId || null;
    const otherId = req.params.otherId;
    
    // Verify user is provided
    // Yeah kinda scuffed just so this can run independent of auth
    if (!userId) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `No user ID provided.`,
            data: null
        });
    }

    // Verify ID formats
    try {
        new mongoose.Types.ObjectId(userId);
        new mongoose.Types.ObjectId(otherId);
    }
    catch (err) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    try {
        // Verify users exist
        let queryUserA = User.findOne({_id:userId})
            .select('-password')
            .lean();
        let queryUserB = User.findOne({_id:otherId})
            .select('-password')
            .lean();

        const userA = await queryUserA.exec();
        const userB = await queryUserB.exec();

        var message;
        if (!userA && !userB)
            message = `Users with ids ${userId} and ${otherId} not found`;
        else if (!userA)
            message = `User with id ${userId} not found`;
        else if (!userB)
            message = `User with id ${otherId} not found`;

        if (!userA || !userB)
            return res.status(httpStatus.NOT_FOUND).json({
                status: httpStatus.NOT_FOUND,
                message: message,
                data: null
            });

        // Check if already following
        if (userA.following.includes(otherId) && userB.followers.includes(userId)) {
            return res.status(httpStatus.NO_CONTENT).json({
                status: httpStatus.NO_CONTENT,
                message: 'Already following user.',
                data: null
            });
        }
        else {
            // Update user A
            if (!userA.following.includes(otherId)) {
                const newFollowingList = userA.following;
                newFollowingList.push(otherId);
                await User.findOneAndUpdate({_id: userId}, {following: newFollowingList})
            }
            if (!userB.followers.includes(userId)) {
                const newFollowersList = userB.following;
                newFollowersList.push(userId)
                await User.findOneAndUpdate({_id: otherId}, {followers: newFollowersList})
            }

            return res.status(httpStatus.NO_CONTENT).json({
                status: httpStatus.NO_CONTENT,
                message: `Successfully followed user.`,
                data: null
            });
        }
    }
    catch (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: `Encountered an error. ${err.message}`,
            data: null
        });
    }
})

// TODO UNFOLLOW
// TODO: Requires authentication tokens

/**
 * @route   POST /login
 * @desc    Authenticates a user and returns a success status. 
 * (Planned to return a JWT token upon implementation).
 * @access  Public
 * @param   {string} req.body.username - User's unique username.
 * @param   {string} req.body.password - User's plain text password.
 * @returns {object} 200 - Successful login.
 * @returns {object} 401 - Unauthorized (Invalid credentials).
 * @returns {object} 400 - Missing username or password.
 */
// TODO LOGIN
// SHALL RETURN JWT TOKEN
router.post('/login', async (req, res) => {
    const username = req.body.username || null;
    const password = req.body.password || null;

    if (username == null || password == null)
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `Username or password are missing`,
            data: null
        });

    const foundUser = await User.findOne({username: username})

    if (foundUser == null)
        return res.status(httpStatus.UNAUTHORIZED).json({
            status: httpStatus.UNAUTHORIZED,
            message: 'Invalid username or password.',
            data: null
        });
    
    const passMatch = await bcrypt.compare(password, foundUser.password);

    if (!passMatch)
        return res.status(httpStatus.UNAUTHORIZED).json({
            status: httpStatus.UNAUTHORIZED,
            message: 'Invalid username or password.',
            data: null
        });

    // TODO: Generate JWT token here 
    return res.status(httpStatus.OK).json({
        status: httpStatus.OK,
        message: 'Login successful',
        data: null // JWT token gets passed back here
    });

});

// DELETE to delete user
// Contemplating if we should have this because it's not a feature we NEED


module.exports = router;
