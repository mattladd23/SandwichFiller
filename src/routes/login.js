// Instantiate express and router
const express = require('express');
const router = express.Router();

// Registration options login route
router.get('/', (req, res) => {
    res.render('login', {
        title: 'Login',
        error: false
    });
});

// STAFF LOGIN

// Render page
router.get('/staff', (req, res) => {
    res.render('login-staff', {
        title: 'Login as a member of staff',
        error: false
    });
});

// Login post request



// STUDENT LOGIN

// Render page
router.get('/student', (req, res) => {
    res.render('login-student', {
        title: 'Login as a student',
        error: false
    });
});

module.exports = router;