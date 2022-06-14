// Instantiate express and router
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('student-welcome', {
        title: 'Welcome Student',
        error: false
    });
});

module.exports = router;