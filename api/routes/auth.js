const express = require('express');
const qs = require('node:querystring'); 
const bodyParser = require('body-parser');
const httpStatus = require('http-status-codes').StatusCodes;
const { default: mongoose } = require('mongoose');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');

const User = require('../schema_models/userSchema.js')
const Tokens = require('../schema_models/tokens.js')

const router = express.Router();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({
            status: httpStatus.UNAUTHORIZED,
            message: `User is not authenticated.`,
            data: null
        });
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
        if (err)
            return res.status(httpStatus.FORBIDDEN).json({
                status: httpStatus.FORBIDDEN,
                message: `You do not have access to this content or method.`,
                data: null
            });

        req.authUser = user;
        next();
    })
}

const generateAccessToken = async (user) => {
    lifeTimeSeconds = 5 * 60; // 5 mins
    return jwt.sign(user, process.env.JWT_ACCESS_SECRET, {expiresIn: lifeTimeSeconds+'s'}) 
}

const generateRefreshToken = async (user) => {
    const lifeTimeDays = 30;
    const refreshToken = jwt.sign(user, process.env.JWT_REFRESH_SECRET, {expiresIn: lifeTimeDays+'d'});

    let future = new Date()
    future.setDate(future.getDate() + lifeTimeDays)
    const refreshExpiry = new Date(future);
    try {
        const tokReq = await Tokens.insertOne({
            tok: refreshToken, 
            userId: user._id,
            expiresAfter: refreshExpiry
        });
    } catch (err) {
        console.log('WARNING! Could not register refresh token in database. Token is effectively useless.');
        console.log(err)
        return null;
    }

    return refreshToken;
}

/* Default is to run this worker every 60 seconds */
const tokenCleanupWorker = (intervalMs = 60000) => {
    setInterval( async () => {
        console.log('Cleaning up tokens...')
        try {
            const deleteRes = await Tokens.deleteMany({
                expiresAfter: { $lt: new Date() }
            });
            if (deleteRes.deletedCount)
                console.log(`Cleaned up ${deleteRes.deletedCount} tokens.`);
        } catch (err) {
            console.log(`Could not clean up tokens. ${err}`)
        }

    }, intervalMs);
}

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

    const user = {_id: foundUser._id, username: foundUser.username, role: foundUser.role};
    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return res.status(httpStatus.OK).json({
        status: httpStatus.OK,
        message: 'Login successful',
        data: {accessToken: accessToken, refreshToken: refreshToken}
    });
});

router.post('/token', async (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken) 
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: 'No refresh token specified.',
            data: null
        });

    const foundToken = await Tokens.findOne({tok: refreshToken});
    if (!foundToken)
        return res.status(httpStatus.FORBIDDEN).json({
            status: httpStatus.FORBIDDEN,
            message: 'Invalid refresh token.',
            data: null
        });

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, user) => {
        if (err)
            return res.status(httpStatus.FORBIDDEN).json({
                status: httpStatus.FORBIDDEN,
                message: 'Invalid refresh token.',
                data: null
            });

        const rawUser = {
            _id: user._id,
            username: user.username,
            role: user.role
        };
        const accessToken = await generateAccessToken(rawUser);

        return res.status(httpStatus.OK).json({
            status: httpStatus.OK,
            message: 'Token refreshed.',
            data: {accessToken: accessToken}
        });
    });
});

router.post('/logout', authenticateToken, async (req, res) => {
    const userId = req.authUser._id;
    const refreshToken = req.body.refreshToken || null;
    if (!refreshToken)
        return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: `No refresh token provided.`,
            data: null
        });

    try {
        const deleteRes = await Tokens.deleteOne({ 
            tok: refreshToken, 
            userId: userId
        });
        
        let message = 'Logged out successfully!'
        if (!deleteRes.deletedCount)
            message = 'Already logged out.'
            
        return res.status(httpStatus.NO_CONTENT).json({
            status: httpStatus.NO_CONTENT,
            message: message,
            data: null
        });
    } catch (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: `Server error. Could not logout.`,
            data: null
        });
    }



})

module.exports = {
    authenticateToken: authenticateToken,
    authRoutes: router,
    tokenCleanupWorker: tokenCleanupWorker
};
