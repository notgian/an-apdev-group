const express = require('express');
const router = express.Router();
const qs = require('node:querystring'); 
const httpStatus = require('http-status-codes').StatusCodes

// Boilerplate code is AI generated. Will replace with actual code once db is made.
// All routes in this file will be accessed via /api/v1/establishments

const Restaurant = require('../schema_models/restaurantSchema.js')
const Reviews = require('../schema_models/reviewSchema.js')

// GET Establishments
router.get('/', async (req, res) => {
    var OFFSET = 0;
    var COUNT = 20;
    var ORDERBY = 'createDate';

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

    let query = Restaurant.find({})
        .skip(OFFSET)       
        .limit(COUNT)
        .lean();
   
    if (ORDERBY == 'createDate') 
        query.sort({createdAt: -1})
    else if (ORDERBY == 'name') 
        query.sort({username: 1})
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

    // Logic for searching for the establishment here let's say an establishment is found
    // const foundEst = `imagine this is establishment data with id '${estId}'`
    const foundEst = undefined;
    
    if (foundEst != undefined) {
        res.send({
            status: httpStatus.OK,
            messages: "OK",
            data: foundEst
        });
    } 
    else {
        res.send({
            status: httpStatus.NOT_FOUND,
            messages: `Establishment with id '${estId}' not found.`,
            data: null
        });
    }
});

// POST to create a new establishment
router.post('/', async (req, res) => {
    // const name = req.body.name
    
    var estCreated = true

    var errorCode = httpStatus.BAD_REQUEST // would only be set if error occurs
    var errorMessage = "Request format is invalid. Please try again."  // same as above

    // 200 success, 400 malformed request, 409 for conflict, 422 for special business rules
    if (estCreated) 
        res.send({
            status: httpStatus.CREATED,
            messages: `Establishment successfully created.`,
            data: "return the establishment data here too"
        });
    else
        res.send({
            status: errorCode,
            messages: errorMessage,
            data: null
        });
});

// PATCH to modify establishment data
// Requires authentication tokens
router.patch("/:id", async (req, res) => {
    // Find establishment first
    var estFound = true

    if (!estFound) {
        res.send({
            status: httpStatus.NOT_FOUND,
            messages: `The establishment with the id ${req.params.id} cannot be found!`,
            data: null
        }) ;
        return;
    }

    // Next, check the querystring if all fields passed are valid fields
    // GEMINI: Note that your original code checks req.query for PATCH updates; 
    // usually, update data is sent in req.body for PATCH.
    let query = req.query
    const editableFields = [
        'name',
        'address',
        'category'
    ]

    for (let key of Object.keys(query)) {
        if (!editableFields.includes(key)) {
            res.send({
                status: httpStatus.BAD_REQUEST,
                messages: `Cannot modify the property '${key}' of establishment. Either the property cannot be modified or the property does not exist.`,
                data: null
            });
            return;
        }
    }

    // Update the entry of the establishment here
   
    // Success
    res.send({
        status: httpStatus.ACCEPTED,
        messages: `Data of establishment ${req.params.id} modified`,
        data: null
    })
})

// DELETE to delete establishment
// Contemplating if we should have this because it's not a feature we NEED

module.exports = router;
