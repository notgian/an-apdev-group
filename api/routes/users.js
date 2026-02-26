const express = require('express');
const router = express.Router();
const qs = require('node:querystring'); 
const httpStatus = require('http-status-codes').StatusCodes


// Boilerplate code is AI generated. Will replace with actual code once db is made.
    // All routes in this file will be accessed via /api/v1/users

// const User = require('../models/User');

// GET Users
router.get('/', async (req, res) => {
    var OFFSET = 0;
    var COUNT = 20;
    var ORDERBY = 'name';

    const orderbyValues = [
        'name',
        'joindate',
        'reviews', // review count
    ];

    if ('offset' in req.query) {
        let offsetNum = Number(req.query.offset);
        if (!isNaN(offsetNum))
            OFFSET = offsetNum;
        else {
            res.send({
                status: httpStatus.BAD_REQUEST,
                messages: "Malformed Query. The offset parameter must be a valid number.",
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
                messages: "Malformed Query. The count parameter must be a valid number.",
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
                messages: `Malformed Query. The orderby value '${order}' is invalid.`,
                data: null
            });
            return;
        }
    }

    // Query for the users with the parameters
    // Insert code here

    // Send the query
    res.send({
        status: httpStatus.OK,
        messages: "OK",
        data: ["will include data here later"] // TODO: Replace this with the result of the query

    })
});

// GET a specific user by ID
router.get('/:id', async (req, res) => {
    const userId = req.params.id;

    // Logic for searching for the user here let's say a user is found
    // const foundUser = `imagine this is user data of user with id '${userId}'`
    const foundUser = undefined;

    if (foundUser != undefined) {
        res.send({
            status: httpStatus.OK,
            messages: "OK",
            data: foundUser
        });
    } 
    else {
        res.send({
            status: httpStatus.NOT_FOUND,
            messages: `User with id '${userId}' not found.`,
            data: null
        });
    }

});

// POST to create a new user
router.post('/', async (req, res) => {
    // const name = req.body.name

    var userCreated = true

    var errorCode = httpStatus.BAD_REQUEST // would only be set if error occurs
    var errorMessage = "Request format is invalid. Please try again."  // same as above

    // 200 success, 400 malformed request, 409 for conflict (i.e. email/username), 422 for specia business rules
    if (userCreated) 
        res.send({
            status: httpStatus.CREATED,
            messages: `User successfully created.`,
            data: "return the userdata here too"
        });
    else
        res.send({
            status: errorCode,
            messages: errorMessage,
            data: null
        });

});

// PATCH to modify user data
// Requires authentication tokens
router.patch("/:id", async (req, res) => {
    // Find user first
    var userFound = true

    if (!userFound) {
        res.send({
            status: httpStatus.NOT_FOUND,
            messages: `The user with the id ${req.params.id} cannot be found!`,
            data: null
        }) ;
        return;
    }

    // Next, check the querystring if all fields passed are valid fields
    let query = req.query
    const editableFields = [
        'name',
        'email'
    ]

    for (let key of Object.keys(query)) {
        if (!editableFields.includes(key)) {
            res.send({
                status: httpStatus.BAD_REQUEST,
                message: `Cannot modify the property '${key}' of user. Either the property cannot be modified or the property does not exist.`,
                data: null
            });
            return;
        }
    }

    // Update the entry of the user here

    // Success
    res.send({
        status: httpStatus.ACCEPTED,
        message: `Userdata of ${req.params.id} modified`,
        data: null
    })

})

// Batch get info of multiple users
router.post( '/batch',async (req, res) => {
    const { ids, fields } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.send(
            { 
                status: httpStatus.BAD_REQUEST,
                message: "Please provide an array of User IDs." 
            });
    }

    // Get the list of users from db
    // TODO: this
    return res.send({
        status: httpStatus.OK,
        message: "OK",
        data: {
            count: 0,
            users: ["Will include code for this in the future once database exists"]
        }
    });
});

// DELETE to delete user
// Contemplating if we should have this because it's not a feature we NEED


module.exports = router;
