// Instantiate express and router
const express = require('express');
const pool = require('../config/db');
const { checkIsAuthenticated } = require('../middleware/checkAuth');
const router = express.Router();

// Define search path variable for development environment
let searchPath = 'SET SEARCH_PATH TO sf; ';

// Define search path variable for testing environment to access test database
if (process.env.NODE_ENV === 'test') {
    searchPath = 'SET SEARCH_PATH TO sf_test; ';
}

// Render loggedin tester page - call it user for now
router.get('/', checkIsAuthenticated, async (req, res) => {

    const userId = req.session.passport.user;

    let q = searchPath
    + 'PREPARE redirectUser(bigint) AS ' 
    + 'SELECT is_staff, is_admin '
    + 'FROM users '
    + 'WHERE user_id = $1; '
    + `EXECUTE redirectUser(${userId});`
    + 'DEALLOCATE redirectUser;';

    console.log(q);

    await pool
        .query(q)
        .then((results) => {

            const isStaff = results[2].rows[0].is_staff;
            const isAdmin = results[2].rows[0].is_admin;

            if (isAdmin) {
                res.redirect('/admin');
            } else if (isStaff) {
                res.redirect('/staff');
            } else {
                res.redirect('/student');
            }
        })
        .catch((e) => {
            console.log(e);
        });
});

module.exports = router;