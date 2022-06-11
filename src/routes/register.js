// Instantiate express and router
const express = require('express');
const router = express.Router();

// Registration options route
router.get('/', (req, res) => {
    res.render('register', {
        title: 'Register',
        error: false
    });
});

module.exports = router;