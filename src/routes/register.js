// Env variables
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Instantiate express and router
const express = require('express');
const router = express.Router();

// Import database model
const pool = require('../config/db');

// Import relevant libraries and modules
const bcrypt = require('bcrypt');
const { checkNotAuthenticated } = require('../middleware/checkAuth');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Instantiate a nodemailer transporter
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'noreply.sandwichfiller@gmail.com',
        pass: 'SfTest1!'
    }
});

// Registration options registration route
router.get('/', (req, res) => {
    res.render('register', {
        title: 'Register',
        error: false
    });
});

// Redirect to login page from register route
router.get('/register/login', checkNotAuthenticated, (req, res) => {
    res.redirect('/login');
});

// STAFF REGISTRATION

// Render page
router.get('/staff', checkNotAuthenticated, (req, res) => {
    res.render('reg-staff', {
        title: 'Register as a member of staff',
        error: false
    });
});

// Post registration form
// Parameterise middleware and express validation

router.post('/staff', checkNotAuthenticated, 
    body('stafffname', 'Invalid name. Check for spaces before or after your name!').isAlpha('en-GB', {ignore: '-'}),
    body('stafflname', 'Invalid name. Check for spaces before or after your name!').isAlpha('en-GB', {ignore: '-'}),
    body('staffemail', 'Email is not a valid UEA email address').isEmail(),
    body('staffpassword', 'Password must be a minimum of 8 characters').isLength({ min: 8 }),
    body('staffconfirmpw').custom((value, { req }) => {
        if (value !== req.body.staffpassword) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    }),

    async (req, res) => {

    // Error handlers
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('reg-staff', {
            title: 'Staff Registration',
            error: true,
            errorMsg: errors.errors[0].msg
        })
    }

    // Create form input variables
    const staffhashedPw = await bcrypt.hash(req.body.staffpassword, 10);
    const staffUserId = Date.now().toString();
    const staffFName = req.body.stafffname;
    const staffLName = req.body.stafflname;
    const staffEmail = req.body.staffemail;
    const staffPassword = staffhashedPw;    

    // Query to check existing credentials
    let qCheckIfExists = 'SET SEARCH_PATH TO sf; ' +
    'SELECT email from users;'

    let credentialExists = false;

    await pool
        .query(qCheckIfExists)
        .then((results) => {
            const rows = results[1].rows;
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].email === req.body.staffemail) {
                    credentialExists = true;
                    return credentialExists;
                }
            }
            return credentialExists;
        })
        .catch((e) => {
            console.log(e);
        })

    if (credentialExists === true) {
        return res.render('reg-staff', {
            title: 'Staff Registration',
            error: true,
            errorMsg: 'One more more of your credentials are invalid. Please try again.'
        });
    }

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
            res.redirect('/login');
        })
    .catch((e) => {
        console.log(e);
    })

    // Create payload and jwt variables for email verification

    }
);


// STUDENT REGISTRATION

// Render page
router.get('/student', checkNotAuthenticated, (req, res) => {
    res.render('reg-student', {
        title: 'Register as a student',
        error: false
    });
});

// Post registration form
// Parameterise middleware and express validation

router.post('/student', checkNotAuthenticated,
    body('studentfname', 'Invalid name. Check for spaces before or after your name!').isAlpha('en-GB', {ignore: '-'}),
    body('studentlname', 'Invalid name. Check for spaces before or after your name!').isAlpha('en-GB', {ignore: '-'}),
    body('studentemail', 'Email is not a valid UEA email address').isEmail(),
    body('studentid', 'Student ID must be a 9 digits in length').isNumeric().isLength({ min: 9, max: 9 }),    
    body('othersectors').isAlpha('en-GB'),
    body('studentpassword', 'Password must be a minimum of 8 characters').isLength({ min: 8 }),
    body('confirmstudentpw').custom((value, { req }) => {
        if (value !== req.body.studentpassword) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    }),

    async (req, res) => {    

    // Error handlers
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('reg-student', {
            title: 'Student Registration',
            error: true,
            errorMsg: errors.errors[0].msg
        })
    }

    // Create form input variables
    const studenthashedPw = await bcrypt.hash(req.body.studentpassword, 10);
    const studentUserId = Date.now().toString();
    const studentFName = req.body.studentfname;
    const studentLName = req.body.studentlname;
    const studentEmail = req.body.studentemail;
    const studentId = req.body.studentid;
    const course = req.body.course;
    const school = req.body.school;
    const placementYear = req.body.placementyear;
    const gradYear = req.body.gradyear;
    const prefSector = req.body.prefsector;
    const otherSectors = req.body.othersectors;
    const studentPassword = studenthashedPw;    

    // Query to check existing credentials

    let qCheckIfExists = 'SET SEARCH_PATH TO sf; ' +
    'SELECT email from users;'

    let credentialExists = false;

    await pool
        .query(qCheckIfExists)
        .then((results) => {
            const rows = results[1].rows;
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].email === req.body.studentemail) {
                    credentialExists = true;
                    return credentialExists;
                }
            }
            return credentialExists;
        })
        .catch((e) => {
            console.log(e);
        })

    if (credentialExists === true) {
        return res.render('reg-student', {
            title: 'Student Registration',
            error: true,
            errorMsg: 'One more more of your credentials are invalid. Please try again.'
        });
    }

    // Query to insert user into database
    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE registerStudent(bigint, text, text, text, text, bigint, text, text, text, numeric, text, text) AS '
    + 'INSERT INTO student (user_id, f_name, l_name, email, password, student_id, course, school, placement_year, grad_year, pref_sector, other_sectors) '
    + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);'
    + `EXECUTE registerStudent(${studentUserId}, '${studentFName}', '${studentLName}', '${studentEmail}', '${studentPassword}', ${studentId}, '${course}', '${school}', '${placementYear}', ${gradYear}, '${prefSector}', '${otherSectors}');`
    + 'DEALLOCATE registerStudent;'
    
    console.log(q);

    await pool
        .query(q)        
        .then(() => {
            res.redirect('/login');

            // Create payload and jwt variables for email verification

            // let payload = {'userid': studentUserId};
            // let token = jwt.sign(payload, process.env.JWT_SECRET);

            // console.log(`Payload: ${payload}`);
            // console.log(`Token: ${token}`);

            // let mailOptions = {
            //     from: '"SandwichFiller" <noreply.sandwichfiller@gmail.com>',
            //     to: studentEmail,
            //     subject: 'Account created successfully',
            //     html: `<p>Please <a href=http://localhost:3000/student/verify/${token}>click here</a> to verify your email</p>`
            // };

            // console.log(`Mail options: ${mailOptions}`);

            // transporter.sendMail(mailOptions, function(err) {
            //     if(err) {
            //         return console.log(err);
            //     }
            // });
        })               
    .catch((e) => {
        console.log(e);
    })

    }
);

router.get('/verify/:token', (req, res) => {

    let { token } = req.params;

    jwt.verify(token, process.env.JWT_SECRET, async function(err, decoded) {
        if (err) {
            console.log(err);
            res.send('Email verification failed');
        } else {
            let id = decoded.userid;
            let q = 'SET SEARCH_PATH TO sf; ' +
            'UPDATE users SET is_verified = TRUE ' +
            `WHERE user_id = ${id}`;
            await pool
                .query(q)
                .then(() => {
                    res.send('Email has been verified. Please go to the login page.');
                })
        }
    });
});


module.exports = router;