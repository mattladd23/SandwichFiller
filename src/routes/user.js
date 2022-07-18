// Instantiate express and router
const express = require('express');
const pool = require('../config/db');
const { checkIsAuthenticated } = require('../middleware/checkAuth');
const router = express.Router();

// Render loggedin tester page - call it user for now
router.get('/', checkIsAuthenticated, async (req, res) => {

    userId = req.session.passport.user;

    let q = 'SET SEARCH_PATH TO SF; ' +
    'PREPARE redirectUser(bigint) AS ' +
    'SELECT is_staff, is_admin ' +
    'FROM users ' +
    'WHERE user_id = $1; ' +
    `EXECUTE redirectUser(${userId});` +
    'DEALLOCATE redirectUser;';

    console.log(q);

    await pool
        .query(q)
        .then((results) => {

            const isStaff = results[2].rows[0].is_staff;
            const isAdmin = results[2].rows[0].is_admin;

            if (isStaff && isAdmin) {
                res.redirect('/admin');
            } else if (isStaff && !isAdmin) {
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