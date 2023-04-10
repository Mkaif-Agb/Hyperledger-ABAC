const express = require('express');
const router = express.Router();
const controller = require('./controller');
const Verify = require('./authentication')


router.post('/registeradmin', controller.registeradmin);
router.post('/register', controller.register);
router.get('/login', controller.login);
router.get('/transaction', Verify.auth ,controller.transaction);
router.post('/registerAgent', Verify.auth ,controller.registerAgent);
router.post('/registerUser', Verify.auth ,controller.registerUser);
router.get('/getUserDetails', Verify.auth ,controller.getUserDetails);



module.exports = router