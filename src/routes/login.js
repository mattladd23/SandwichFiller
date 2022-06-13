// Env variables
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Instantiate express and router
const express = require('express');
const router = express.Router();

// Import database model
const pool = require('../config/db');

// Import and initialize passport
const passport = require('passport');
const initializeStaffPassport = require('../config/passportStaff');

// Other relevant libraries
const flash = require('express-flash');

// Instantiate passport
initializeStaffPassport(passport);

// Middleware
router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

// Registration options login route
router.get('/', (req, res) => {
    res.render('login', {
        title: 'Login',
        error: req.query.error      
    });
});

// STAFF LOGIN

// Render page
router.get('/staff', (req, res) => {
    res.render('login-staff', {
        title: 'Login as a member of staff',
        error: req.query.error
    });
});

// Login post request
router.post('/staff', passport.authenticate('local', {
    successRedirect: '/staff',
    failureRedirect: '/login/staff?error=true',
    failureFlash: true
}));


// STUDENT LOGIN

// Render page
router.get('/student', (req, res) => {
    res.render('login-student', {
        title: 'Login as a student',
        error: false
    });
});

// Login post request
router.post('/student')


module.exports = router;