// Env variables
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Instantiate express and router
const express = require('express');
const router = express.Router();

// Import and initialize passport
const passport = require('passport');
const initializePassport = require('../config/passport');

// Other relevant libraries and modules
const flash = require('express-flash');
const { checkNotAuthenticated } = require('../middleware/checkAuth');

// Instantiate passport
initializePassport(passport);

// Middleware
router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

// Render login page
router.get('/', checkNotAuthenticated, (req, res) => {
    res.render('login', {
        title: 'Login',
        error: req.query.error,
        errorMsg: 'Incorrect email or password!'
    });
});

// Login post request
router.post('/', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/user',
    failureRedirect: '/login?error=true',
    failureFlash: true
}));

module.exports = router;