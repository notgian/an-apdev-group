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
    console.log(err.stack)
    if (err) {
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
    var userFound = true
});

// TODO USER CREATES REVIEW
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

// TODO USER UPDATES REVIEW (ONLY supports editing the text)
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

// TODO USER DELETES REVIEW
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

// TODO OWNER CREATES REPLY
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
        new: true,       
        runValidators: true 
    });
    return res.status(httpStatus.OK).json({
        status: httpStatus.OK,
        message: `Ower ${ownerId} responded to user ${userId} successfully`,
        data: updatedReview
    });
})

// TODO OWNER UPADTES REPLY
// TODO: Requires authentication tokens
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
    if (foundReview.ownerResponse != undefined)
        return res.status(httpStatus.CONFLICT).json({
            status: httpStatus.CONFLICT,
            message: `Owner ${ownerId} already has a response to the user ${userId}`,
            data: null
        });

    const updateReview = {
        ownerResponse: {
            comment: comment,
        }
    }
    const updatedReview = await Reviews.findOneAndUpdate(reviewFilter, updateReview, {
        new: true,       
        runValidators: true 
    });
    return res.status(httpStatus.OK).json({
        status: httpStatus.OK,
        message: `Ower ${ownerId} response to user ${userId} updated successfully`,
        data: updatedReview
    });
})

// TODDO OWNER DELETES REPLY
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
        ownerResponse: undefined
    }
    const updatedReview = await Reviews.findOneAndUpdate(reviewFilter, updateReview, {
        new: false,       
        runValidators: true 
    });
    return res.status(httpStatus.OK).json({
        status: httpStatus.OK,
        message: `Ower ${ownerId} response to user ${userId} deleted successfully`,
        data: updatedReview
    });
});

// TODO MARK HELPFUL
// TODO: Requires authentication tokens
router.post('/:userid/helpful/:reviewid', async (req, res) => {
    const userId = req.params.userId;
    const reviewId = req.params.reviewId;
    
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
    if (markedHelpful)
        return res.status(httpStatus.CONFLICT).json({
            status: httpStatus.CONFLICT,
            message: `User has already marked the review as helpful`,
            data: null
        });

    // Update review to record and mark it as helpful
    let newUnhelpful = foundReview.unhelpfulVotes
    let newUnhelpfulCount = foundReview.unhelpfulCount

    if (markedUnhelpful) {
        newUnhelpful = newUnhelpful.filter(i => i!=userId);
        newUnhelpfulCount--
    }

    try {
        const updatedReview = await Reviews.findOneAndUpdate({_id:reviewId}, {
            unhelpfulVotes: newUnhelpful,
            unhelpfulCount: newUnhelpfulCount,
            helpfulVotes: foundReview.helpfulVotes.concat(new mongoose.Types.ObjectId(userId)),
            helpfulCount: foundReview.helpfulCount + 1
        }, {
            new: true,
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

// TODO MARK UNHELPFUL
// TODO: Requires authentication tokens
router.post('/:userId/unhelpful/:reviewId', async (req, res) => {
    const userId = req.params.userId;
    const reviewId = req.params.reviewId;
    
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
    if (markedUnhelpful)
        return res.status(httpStatus.CONFLICT).json({
            status: httpStatus.CONFLICT,
            message: `User has already marked the review as unhelpful`,
            data: null
        });

    // Update review to record and mark it as helpful
    let newHelpful = foundReview.helpfulVotes
    let newHelpfulCount = foundReview.helpfulCount

    if (markedHelpful) {
        newHelpful = newHelpful.filter(i => i!=userId);
        newHelpfulCount--
    }

    try {
        const updatedReview = await Reviews.findOneAndUpdate({_id:reviewId}, {
            helpfulVotes: newHelpful,
            helpfulCount: newHelpfulCount,

            unhelpfulVotes: foundReview.unhelpfulVotes.concat(new mongoose.Types.ObjectId(userId)),
            unhelpfulCount: foundReview.unhelpfulCount + 1
        }, {
            new: true,
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

// TODO UNMARK HELPFUL/UNHELPFUL
// TODO: Requires authentication tokens
router.post('/:userId/unmark/:reviewId', async (req, res) => {
    const userId = req.params.userId;
    const reviewId = req.params.reviewId;
    
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
            new: true,
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

// TODO UNFOLLOW
// TODO: Requires authentication tokens

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

// Batch get info of multiple users
// router.post( '/batch',async (req, res) => {
    //     const { ids, fields } = req.body;
    //
        //     if (!ids || !Array.isArray(ids) || ids.length === 0) {
            //         return res.status(s).json(
                //             {send(
                //             { 
                    //                 status: httpStatus.BAD_REQUEST,
                    //                 message: "Please provide an array of User IDs." 
                    //             });
            //     }
    //
        //     // Get the list of users from db
    //     // TODO: this
    //     return res.status(httpStatus.OK).json({
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
