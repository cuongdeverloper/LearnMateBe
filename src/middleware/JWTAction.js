const jwt = require('jsonwebtoken');
require('dotenv').config();

const createJWT = (payload) => {
    const key = process.env.JWT_SECRET;
    const options = { expiresIn: process.env.JWT_EXPIRES_IN };
    try {
        return jwt.sign(payload, key, options);
    } catch (error) {
        console.error('Error creating JWT:', error);
        return null;
    }
};
const createJWTResetPassword = (payload) => {
    const key = process.env.JWT_SECRET;
    const options = { expiresIn: '5m' };
    try {
        return jwt.sign(payload, key, options);
    } catch (error) {
        console.error('Error creating JWT:', error);
        return null;
    }
};
const createRefreshToken = (payload) => {
    const key = process.env.REFRESH_TOKEN_SECRET;
    const options = { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN };
    try {
        return jwt.sign(payload, key, options);
    } catch (error) {
        console.error('Error creating refresh token:', error);
        return null;
    }
};

const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

const verifyToken = (token, key) => {
    try {
        return jwt.verify(token, key);
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
};

const verifyAccessToken = (token) => verifyToken(token, process.env.JWT_SECRET);
const verifyRefreshToken = (token) => verifyToken(token, process.env.REFRESH_TOKEN_SECRET);

const checkAccessToken = (req, res, next) => {
    // const nonSecurePaths = ["/", "/login"];
    // if (nonSecurePaths.includes(req.path)) {
    //     return next();
    // }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Rename the variable to avoid conflict with the function name
    // let decodedToken = decodeToken(token);
    // console.log('Decoded Token:', decodedToken);
    
    if (!token) {
        return res.status(401).json({
            EC: -1,
            data: '',
            EM: 'Not authenticated user'
        });
    }

    const verifiedToken = verifyAccessToken(token);
    if (!verifiedToken) {
        return res.status(401).json({ message: 'Invalid or expired access token' });
    }

    req.user = verifiedToken;
    next();
};

module.exports = {
    createJWT,
    createRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    checkAccessToken,
    decodeToken,
    createJWTResetPassword
};
