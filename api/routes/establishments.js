const express = require('express');
const qs = require('node:querystring'); 
const httpStatus = require('http-status-codes').StatusCodes
const { default: mongoose } = require('mongoose')

const router = express.Router();

// All routes in this file will be accessed via /api/v1/establishments

const Restaurant = require('../schema_models/restaurantSchema.js')
const Reviews = require('../schema_models/reviewSchema.js')

/**
 * @route   GET /
 * @desc    Retrieve a paginated list of establishments with optional search and sorting.
 * @access  Public
 * @query   {number} offset - Number of records to skip.
 * @query   {number} count - Number of records to return.
 * @query   {string} orderby - Field to sort by (name, createDate, rating).
 * @query   {string} search - Search string for usernames.
 * @query   {string} city - Search string for city.
 * @query   {string} minRating - Search for minimum average rating.
 * @query   {string} minPrice - Search for minimum price.
 * @query   {string} maxPrice- Search for maximum price
 * @returns {object} 200 - OK with an array of establishment objects.
 * @returns {object} 400 - Malformed Query (invalid number format or values).
 */
router.get('/', async (req, res) => {
    var OFFSET = 0;
    var COUNT = 20;
    var ORDERBY = 'createDate';
    var SEARCH = null;

    const orderbyValues = [
        'name',
        'createDate',
        'rating',
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

    let queryObj = {}
    if ('search' in req.query && req.query.search !== '') {
        SEARCH = req.query.search
        queryObj['$or'] = [
            { name: {$regex: `.*${SEARCH}.*`, $options: 'i'} },
            { description: {$regex: `.*${SEARCH}.*`, $options: 'i'} },
        ]
    }

    // Filter by City/Location
    if ('city' in req.query && req.query.city !== '') {
        queryObj['location.city'] = {$regex: `.*${req.query.city}.*`, $options: 'i'}
    }

    // Filter by Minimum Rating
    if ('minRating' in req.query && req.query.minRating !== '') {
        // Adds a filter where avgRating is greater than or equal to ($gte) the requested rating
        queryObj['avgRating'] = { $gte: Number(req.query.minRating) }
    }

    //s Filter by Price Range
    if ('minPrice' in req.query && req.query.minPrice !== '') {
        queryObj['priceRange.min'] = { $gte: Number(req.query.minPrice) }
    }
    if ('maxPrice' in req.query && req.query.maxPrice !== '') {
        queryObj['priceRange.max'] = { $lte: Number(req.query.maxPrice) }
    }
    
    let query = Restaurant.find(queryObj)
        .skip(OFFSET)       
        .limit(COUNT)
        .lean();
   
    // if (ORDERBY == 'createDate') 
    //     query.sort({createdAt: -1})
    // else if (ORDERBY == 'name') 
    //     query.sort({name: 1})
    // else if (ORDERBY == 'rating') 
    //     query.sort({avgRating: 1})
    // else
    //     query.sort({createdAt: -1})

    let foundRstrs = await query.exec()

    const totalCount = await Restaurant.countDocuments(queryObj);
    const maxPages = Math.ceil(totalCount / COUNT);
    const page = Math.floor(OFFSET / COUNT) + 1;
    const start = OFFSET + 1;
    const end = OFFSET + foundRstrs.length;

    res.send({
        status: httpStatus.OK,
        message: "OK",
        data: foundRstrs,
        totalCount,
        page,
        maxPages,
        start,
        end
    });
});

/**
 * @route   GET /:id
 * @desc    Retrieve a particular establishment with their id.
 * @access  Public
 * @returns {object} 200 - OK with an array of establishment objects.
 * @returns {object} 400 - Malformed Query (invalid number format or values).
 * @returns {object} 404 - No establishment with specified id is found.
 */
router.get('/:id', async (req, res) => {
    const estId = req.params.id;

    try {
        new mongoose.Types.ObjectId(estId)
    }
    catch (err) {
        return res.send({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    let query = Restaurant.find({_id:estId})
        .lean();

    const foundRstr = await query.exec()

    if (foundRstr.length > 0) {
        res.send({
            status: httpStatus.OK,
            message: "OK",
            data: foundRstr
        });
    } 
    else {
        res.send({
            status: httpStatus.NOT_FOUND,
            message: `Establishment with id '${estId}' not found.`,
            data: null
        });
    }
});

/**
 * @route   GET /reviews/:id
 * @desc    Retrieve the reviews of a particular establishment given their id.
 * @access  Public
 * @query   {string} user - Optional userid to limit review to that user only. 
 * @query   {string} search - Optional string to search in reviews
 * @returns {object} 200 - OK with an array of establishment objects.
 * @returns {object} 400 - Malformed Query (invalid number format or values).
 * @returns {object} 404 - No establishment with specified id is found.
 */
router.get("/reviews/:id", async (req, res) => {
    const rstrId = req.params.id;

    try {
        new mongoose.Types.ObjectId(rstrId)
    }
    catch (err) {
        return res.send({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    let query = Restaurant.find({_id:rstrId})
        .lean();

    const foundRstr = await query.exec()

    if (foundRstr.length <= 0)
        return res.send({
            status: httpStatus.NOT_FOUND,
            message: `The establishment does not exist!`,
            data: null
        });

    var OFFSET = 0;
    var COUNT = 10;

    let qry = {
        restaurantId: req.params.id,
    }
    // OPTIONAL user filter
    if ('user' in req.query) {
        qry['userId'] = req.query.user;
    }
    // OPTIONAL search filter (comment)
    if ('comment' in req.query) {
        qry['comment'] = {$regex: `.*${req.query.comment}.*`, $options: 'i'}
    }

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

    // Find and return the reviews
    try {
        const totalCount = await Reviews.countDocuments(qry);

        const reviewQry = Reviews.find(qry)
            .skip(OFFSET)
            .limit(COUNT)
            .populate('userId', ['username', 'avatar', 'role'])
            .populate({
                path: 'ownerResponse',
                populate: {
                    path: 'ownerId',
                    model: 'User'
                }
            })
            .lean();

        let reviews = await reviewQry.exec() || [];
        let userReview = null;

        const viewerId = req.query.viewerId;
        if (viewerId && mongoose.Types.ObjectId.isValid(viewerId)) {
            reviews = reviews.map(review => {
                let marked = null;
                if (review.helpfulVotes && review.helpfulVotes.some(id => id.toString() === viewerId)) {
                    marked = 'helpful';
                } else if (review.unhelpfulVotes && review.unhelpfulVotes.some(id => id.toString() === viewerId)) {
                    marked = 'unhelpful';
                }
                return { ...review, marked: marked };
            });

            userReview = await Reviews.findOne({ restaurantId: rstrId, userId: viewerId })
                .populate('userId', ['username', 'avatar', 'role'])
                .lean();
        }

        console.log("sending reviews:", reviews);

        res.send({
            status: httpStatus.OK,
            message: `OK`,
            data: {
                userReview: userReview || null,
                reviews,
                totalCount
            }
        }) ;
    } 
    catch (err) {
        res.send({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: `Could not fetch establishment reviews ${err.message}`,
            data: null
        }) ;
    }
});

module.exports = router;
