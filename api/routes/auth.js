const httpStatus = require('http-status-codes').StatusCodes;
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(authHeader)

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

module.exports = authenticateToken;
