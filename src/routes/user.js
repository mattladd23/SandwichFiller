// Instantiate express and router
const express = require('express');
const { checkIsAuthenticated } = require('../middleware/checkAuth');
const router = express.Router();

// Render loggedin tester page - call it user for now
router.get('/', checkIsAuthenticated, (req, res) => {
    // res.render('loggedin', {
    //     title: 'Welcome!',
    //     error: req.query.error      
    // });
    // Redirect to student while working on student user story
    res.redirect('/student');
});

module.exports = router;