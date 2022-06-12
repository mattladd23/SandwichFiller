// Env variables
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Instantiate express and router
const express = require('express');
const router = express.Router();

// Import database model
const pool = require('../config/db');

// Import relevant libraries
const bcrypt = require('bcrypt');

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

// STAFF REGISTRATION

// Render page
router.get('/staff', (req, res) => {
    res.render('reg-staff', {
        title: 'Register as a member of staff',
        error: false
    });
});

// Post registration form

router.post('/staff', async (req, res) => {

    // Parameterise middleware and express validation

    // Error handlers

    // Create form input variables
    const staffhashedPw = await bcrypt.hash(req.body.staffpassword, 10);
    const staffUserId = Date.now().toString();
    const staffFName = req.body.stafffname;
    const staffLName = req.body.stafflname;
    const staffEmail = req.body.staffemail;
    const staffPassword = staffhashedPw;

    console.log(staffUserId, staffFName, staffFName, staffEmail, staffPassword);

    // Query to check existing credentials

    // Query to insert user into database
    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE registerStaff(bigint, text, text, text, text) AS '
    + 'INSERT INTO staff (user_id, f_name, l_name, email, password) '
    + 'VALUES ($1, $2, $3, $4, $5);'
    + `EXECUTE registerStaff(${staffUserId}, '${staffFName}', '${staffLName}', '${staffEmail}', '${staffPassword}');`
    + 'DEALLOCATE registerStaff;'

    await pool
        .query(q)
        .then(() => {
            res.redirect('/login/staff');
        })
    .catch((e) => {
        console.log(e);
    })

    // Create payload and jwt variables for email verification

})




// Student registration
router.get('/student', (req, res) => {
    res.render('reg-student', {
        title: 'Register as a student',
        error:false
    });
});


module.exports = router;