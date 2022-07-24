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
const fs = require('fs');
// const { readHTMLFile } = require('../middleware/readHTMLfile');
const { handlebars } = require('hbs');
const { stringEscape, resultsHtmlEscape } = require('../middleware/escape');
const methodOverride = require('method-override');

// Define search path variable for development environment
let searchPath = 'SET SEARCH_PATH TO sf; ';

// Define search path variable for testing environment to access test database
if (process.env.NODE_ENV === 'test') {
    searchPath = 'SET SEARCH_PATH TO sf_test; ';
}

// Middleware
router.use(methodOverride('_method'));

// Function to read HTML files
let readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function(err, html) {
        if (err) {
            callback(err);
            throw err;
        } else {
            callback(null, html);
        }
    });
};


// Instantiate a nodemailer transporter
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: true,
    service: 'gmail',
    auth: {
        user: 'noreply.sandwichfiller@gmail.com',
        pass: 'yrkncjogdgeunxru'
    }
});


router.get('/', checkNotAuthenticated, (req, res) => {
    res.render('forgot-email', {
        title: 'Password reset',
        error: req.query.error
    });
});

router.post('/', checkNotAuthenticated, 
    body('emailforgot', 'Invalid email address').isEmail(),

    async (req, res) => {

    // Error handlers
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('forgot-email', {
            title: 'Password reset',
            error: true,
            errorMsg: errors.errors[0].msg
        })
    }

    // Create form input variables
    const email = stringEscape(req.body.emailforgot);

    // Query to check existing credentials
    let qCheckIfExists = searchPath
    + 'SELECT email, is_verified from users;'

    let credentialExists = false;

    await pool
        .query(qCheckIfExists)
        .then((results) => {            
            const rows = results[1].rows;
            console.log(rows);

            for (let i = 0; i < rows.length; i++) {
                if (rows[i].email === email && rows[i].is_verified === true) {
                    credentialExists = true;
                    return credentialExists;
                }
            }
            return credentialExists;
        })
        .catch((e) => {
            console.log(e);
        })

    if (!credentialExists) {
        return res.render('forgot-email', {
            title: 'Password reset',
            error: true,
            errorMsg: 'Email not recognised'
        });
    }

    // Query to find user id to pass into payload for email verification

    let qUserId = searchPath
    + 'PREPARE getUserId(text) AS '
    + 'SELECT user_id '
    + 'FROM users '
    + 'WHERE email = $1; '
    + `EXECUTE getUserId('${email}'); `
    + 'DEALLOCATE getUserId;';

    console.log(qUserId);

    await pool
        .query(qUserId)
        .then((results) => {
            res.send('An email containing a password reset link has been sent to you. Make sure to check your junk folder!');

            // Create payload and jwt variables for email verification
            let userId = results[2].rows[0].user_id;
            console.log(userId);

            let payload = {'user_id': userId};
            let token = jwt.sign(payload, process.env.JWT_SECRET);

            console.log(`Payload: ${payload}`);
            console.log(`Payload user id: ${payload.user_id}`);
            console.log(`Token: ${token}`);

            let mailOptions = {
                from: '"SandwichFiller" <noreply.sandwichfiller@gmail.com',
                to: email,
                subject: 'Password reset link',
                html: `<p>Please <a href=http://localhost:3000/forgot/${token}>click here</a> to continue with your password reset</p>`
            }

            console.log(`Mail options: ${mailOptions}`);

            transporter.sendMail(mailOptions, function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        })
        .catch((e) => {
            console.log(e);
        })
    }    
);

// Render page to enter new password
router.get('/:token', checkNotAuthenticated, (req, res) => {
    res.render('forgot-password', {
        title: 'Password reset',
        error: req.query.error,
        success: req.query.success,
        token: req.params.token
    });
});

router.put('/:token', checkNotAuthenticated,
    body('newpw', 'Password must be a minimum of 8 characters').isLength({ min: 8 }),
    body('confirmnewpw').custom((value, { req }) => {
        if (value !== req.body.newpw) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    }),

    async(req, res) => {
    
    // Error handlers
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('forgot-password', {
            title: 'Password reset',
            error: true,
            errorMsg: errors.errors[0].msg
        })
    }

    console.log('No errors yet...');

    // Create form input variables
    const hashedNewPw = await bcrypt.hash(req.body.newpw, 10);
    // const newPw = stringEscape(hashedNewPw);

    console.log(hashedNewPw);
    // console.log(newPw);

    // Token variable
    let { token } = req.params;
    console.log(`Token: ${token}`);

    jwt.verify(token, process.env.JWT_SECRET, async function(err, decoded) {
        if (err) {
            console.log(err);
            res.send('Email verification failed');
        } else {

            console.log(`Decoded: ${decoded}`);

            let userId = decoded.user_id;

            console.log(`User ID: ${userId}`);

            let qNewPw = searchPath
            + 'PREPARE updatePwForgot(text, bigint) AS '
            + 'UPDATE users '
            + 'SET '
            + 'password = $1 '
            + 'WHERE user_id = $2; '
            + `EXECUTE updatePwForgot('${hashedNewPw}', ${userId}); `
            + 'DEALLOCATE updatePwForgot;'

            console.log(qNewPw);

            await pool
                .query(qNewPw)
                .then(() => {
                    // res.redirect('/login?success=true');
                    res.render('forgot-password', {
                        title: 'Password reset',
                        success: true,
                        successMsg: 'Password reset successfully! Continue to the login page to access your account!'
                    })
                })
                .catch((e) => {
                    console.log(e);
                })
        }
    })}
);

router.get('/result', checkNotAuthenticated, (req, res) => {
    res.render('forgot-result', {
        title: 'Password reset',
        success: true,
        msg: 'Password reset successfully!'
    });
});

module.exports = router;