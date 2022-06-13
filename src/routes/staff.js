// Instantiate express and router
const express = require('express');
const router = express.Router();

// Render login success page
router.get('/', (req, res) => {
    res.render('staff-welcome', {
        title: 'Welcome Staff',
        error: false
    });
});

module.exports = router;