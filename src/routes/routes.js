const express = require('express');
const routerApi = express.Router();
const { checkAccessToken } = require('../middleware/JWTAction');
const { addUser } = require('../controller/User/UserController');



routerApi.post('/user', addUser);
module.exports = { routerApi };