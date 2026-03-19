const express = require('express');
const qs = require('node:querystring'); 
const httpStatus = require('http-status-codes').StatusCodes
const { default: mongoose } = require('mongoose')

const router = express.Router();

// Boilerplate code is AI generated. Will replace with actual code once db is made.
// All routes in this file will be accessed via /api/v1/establishments

const Restaurant = require('../schema_models/restaurantSchema.js')
const Reviews = require('../schema_models/reviewSchema.js')

// GET Establishments
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
    if ('search' in req.query) {
        SEARCH = req.query.search
        // queryObj['$text'] = {$search: SEARCH}
        queryObj['name'] = {$regex: `.*${SEARCH}.*`, $options: 'i'}
    }
    let query = Restaurant.find(queryObj)
        .skip(OFFSET)       
        .limit(COUNT)
        .lean();
   
    if (ORDERBY == 'createDate') 
        query.sort({createdAt: -1})
    else if (ORDERBY == 'name') 
        query.sort({name: 1})
    else if (ORDERBY == 'rating') 
        query.sort({avgRating: 1})
    else
        query.sort({createdAt: -1})
    let foundRstrs = await query.exec()

    res.send({
        status: httpStatus.OK,
        message: "OK",
        data: foundRstrs
    })
});

// GET a specific establishment by ID
router.get('/:id', async (req, res) => {
    const estId = req.params.id;

    try {
        new mongoose.Types.ObjectId(estId)
    }
    catch (err) {
        res.send({
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

router.get("/reviews/:id", async (req, res) => {
    const rstrId = req.params.id;

    try {
        new mongoose.Types.ObjectId(rstrId)
    }
    catch (err) {
        res.send({
            status: httpStatus.BAD_REQUEST,
            message: `Invalid ID format: ${err.message}`,
            data: null
        });
    }

    let query = Restaurant.find({_id:rstrId})
        .lean();

    const foundRstr = await query.exec()

    if (foundRstr.length > 0) {
        let qry = {
            restaurantId: req.params.id,
        }
        // OPTIONAL user filter
        if ('user' in req.query) {
            qry['userId'] = req.query.user;
        }
        // Find and return the reviews
        try {
            const reviewQry = Reviews.find(qry)
                .populate('userId', ['username', 'avatar', 'role'])
                .populate({
                    path: 'ownerResponse',
                    populate: {
                        path: 'ownerId',
                        model: 'User'
                    }
                })
                .lean();

            const reviews = await reviewQry.exec();

            res.send({
                status: httpStatus.OK,
                message: `OK`,
                data: reviews
            }) ;
        } 
        catch (err) {
            res.send({
                status: httpStatus.INTERNAL_SERVER_ERROR,
                message: `Could not fetch establishment reviews ${err.message}`,
                data: null
            }) ;
        }
    } else {
        res.send({
            status: httpStatus.NOT_FOUND,
            message: `The establishment does not exist!`,
            data: null
        }) ;
        return;
    }
    var userFound = true
});

// Get establishment reviews
// POST to create a new establishment
// Don't really need as it's not part of specs

// PATCH to modify establishment data
// Don't really need as it's not part of specs
// Requires authentication tokens
// router.patch("/:id", async (req, res) => {
//     // Find establishment first
//     var estFound = true
//
//     if (!estFound) {
//         res.send({
//             status: httpStatus.NOT_FOUND,
//             messages: `The establishment with the id ${req.params.id} cannot be found!`,
//             data: null
//         }) ;
//         return;
//     }
//
//     // Next, check the querystring if all fields passed are valid fields
//     // GEMINI: Note that your original code checks req.query for PATCH updates; 
//     // usually, update data is sent in req.body for PATCH.
//     let query = req.query
//     const editableFields = [
//         'name',
//         'address',
//         'category'
//     ]
//
//     for (let key of Object.keys(query)) {
//         if (!editableFields.includes(key)) {
//             res.send({
//                 status: httpStatus.BAD_REQUEST,
//                 messages: `Cannot modify the property '${key}' of establishment. Either the property cannot be modified or the property does not exist.`,
//                 data: null
//             });
//             return;
//         }
//     }
//
//     // Update the entry of the establishment here
//    
//     // Success
//     res.send({
//         status: httpStatus.ACCEPTED,
//         messages: `Data of establishment ${req.params.id} modified`,
//         data: null
//     })
// })

// DELETE to delete establishment
// Contemplating if we should have this because it's not a feature we NEED

module.exports = router;
