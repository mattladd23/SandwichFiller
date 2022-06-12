// Instantiate express and router
const express = require('express');
const router = express.Router();

// Registration options registration route
router.get('/', (req, res) => {
    res.render('register', {
        title: 'Register',
        error: false
    });
});

// Redirect to login page from register route
router.get('/register/login', (req, res) => {
    res.redirect('/login');
});

// Staff registration
router.get('/staff', (req, res) => {
    res.render('reg-staff', {
        title: 'Register as a member of staff',
        error: false
    });
});


// Student registration
router.get('/student', (req, res) => {
    res.render('reg-student', {
        title: 'Register as a student',
        error:false
    });
});


module.exports = router;