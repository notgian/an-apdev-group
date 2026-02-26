const express = require('express');
const router = express.Router();
const qs = require('node:querystring'); 
const httpStatus = require('http-status-codes').StatusCodes

// Boilerplate code is AI generated. Will replace with actual code once db is made.
// All routes in this file will be accessed via /api/v1/establishments

// const Establishment = require('../models/Establishment');

// GET Establishments
router.get('/', async (req, res) => {
    var OFFSET = 0;
    var COUNT = 20;
    var ORDERBY = 'name';

    const orderbyValues = [
        'name',
        'rating',
        'category', 
    ];

    if ('offset' in req.query) {
        let offsetNum = Number(req.query.offset);
        if (!isNaN(offsetNum))
            OFFSET = offsetNum;
        else {
            res.send({
                "status": httpStatus.BAD_REQUEST,
                "message": "Malformed Query. The offset parameter must be a valid number.",
                "data": null
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
                "status": httpStatus.BAD_REQUEST,
                "message": "Malformed Query. The count parameter must be a valid number.",
                "data": null
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
                "status": httpStatus.BAD_REQUEST,
                "message": `Malformed Query. The orderby value '${order}' is invalid.`,
                "data": null
            });
            return;
        }
    }

    // Query for the establishments with the parameters
    // Insert code here
    
    // Send the query
    res.send({
        "status": httpStatus.OK,
        "message": "OK",
        "data": ["will include data here later"] // TODO: Replace this with the result of the query
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
            "status": httpStatus.OK,
            "message": "OK",
            "data": foundEst
        });
    } 
    else {
        res.send({
            "status": httpStatus.NOT_FOUND,
            "message": `Establishment with id '${estId}' not found.`,
            "data": null
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
            "status": httpStatus.CREATED,
            "message": `Establishment successfully created.`,
            "data": "return the establishment data here too"
        });
    else
        res.send({
            "status": errorCode,
            "message": errorMessage,
            "data": null
        });
});

// PATCH to modify establishment data
// Requires authentication tokens
router.patch("/:id", async (req, res) => {
    // Find establishment first
    var estFound = true

    if (!estFound) {
        res.send({
            "status": httpStatus.NOT_FOUND,
            "message": `The establishment with the id ${req.params.id} cannot be found!`,
            "data": null
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
                "status": httpStatus.BAD_REQUEST,
                "message": `Cannot modify the property '${key}' of establishment. Either the property cannot be modified or the property does not exist.`,
                "data": null
            });
            return;
        }
    }

    // Update the entry of the establishment here
   
    // Success
    res.send({
        "status": httpStatus.ACCEPTED,
        "message": `Data of establishment ${req.params.id} modified`,
        "data": null
    })
})

// DELETE to delete establishment
// Contemplating if we should have this because it's not a feature we NEED

module.exports = router;
