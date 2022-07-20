// Instantiate express and router
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Import database model
const pool = require('../config/db');

// Other libraries and modules
const methodOverride = require('method-override');
const { checkIsAuthenticated } = require('../middleware/checkAuth');
const { checkIsAdmin } = require('../middleware/checkPermission');
const { stringEscape, resultsHtmlEscape } = require('../middleware/escape');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

// Middleware
router.use(methodOverride('_method'));

// Render admin dashboard
router.get('/', checkIsAuthenticated, checkIsAdmin, async (req, res) => {
    res.render('admin-dashboard', {
        title: 'SandwichFiller - Admin',
        error: false
    });
});

// Render manage users page
router.get('/users', checkIsAuthenticated, checkIsAdmin, async (req, res) => {

    let qStaff = 'SET SEARCH_PATH TO sf; ' +
    'SELECT user_id, email, is_verified, is_staff, is_admin ' +
    'FROM users ' +
    'WHERE ' +
    'is_verified = true ' +
    'AND ' +
    'is_staff = true ' +
    'AND ' +
    'is_admin = false;'

    console.log(qStaff);

    let qStudents = 'SET SEARCH_PATH TO sf; ' +
    'SELECT user_id, email, is_verified, is_staff, is_admin ' +
    'FROM users ' +
    'WHERE ' +
    'is_verified = true ' +
    'AND ' +
    'is_staff = false ' +
    'AND ' +
    'is_admin = false; '

    console.log(qStudents);

    let qUnverified = 'SET SEARCH_PATH TO sf; ' +
    'SELECT user_id, email, is_verified, is_staff, is_admin ' +
    'FROM users ' +
    'WHERE is_verified = false;'

    console.log(qUnverified);

    await Promise.all([
        pool.query(qStaff),
        pool.query(qStudents),
        pool.query(qUnverified)
    ])
        .then(([
            qStaffRes,
            qStudentsRes,
            qUnverifiedRes
        ]) => {
            // Assign results objects to variables to be produced in hbs

            const staffUsers = qStaffRes[1].rows;
            console.log(staffUsers);
            const staffUserFeatures = ['user_id', 'email'];
            const sanitizedStaffUsers = resultsHtmlEscape(staffUsers, staffUserFeatures, ['user_id']);

            const studentUsers = qStudentsRes[1].rows;
            console.log(studentUsers);
            const studentUserFeatures = ['user_id', 'email'];
            const sanitizedStudentUsers = resultsHtmlEscape(studentUsers, studentUserFeatures, ['user_id']);

            const unverifiedUsers = qUnverifiedRes[1].rows;
            console.log(unverifiedUsers);
            const unverifiedUserFeatures = ['user_id', 'email'];
            const sanitizedUnverifiedUsers = resultsHtmlEscape(unverifiedUsers, unverifiedUserFeatures, ['user_id']);

            if (staffUsers.length === 0 && studentUsers.length === 0 && unverifiedUsers.length === 0) {
                return res.render('admin-users', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: true,
                    noStudentUsers: true,
                    noUnverifiedUsers: true
                });

            } else if (studentUsers.length === 0 && unverifiedUsers.length === 0) {
                return res.render('admin-users', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: false,
                    staffUsers: sanitizedStaffUsers,
                    noStudentUsers: true,
                    noUnverifiedUsers: true
                });

            } else if (staffUsers.length === 0 && unverifiedUsers.length === 0) {
                return res.render('admin-users', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: true,
                    noStudentUsers: false,
                    studentUsers: sanitizedStudentUsers,
                    noUnverifiedUsers: true
                });

            } else if (staffUsers.length === 0 && studentUsers.length === 0) {
                return res.render('admin-users', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: true,
                    noStudentUsers: true,
                    noUnverifiedUsers: false,
                    unverifiedUsers: sanitizedUnverifiedUsers
                });

            } else if (staffUsers.length === 0) {
                return res.render('admin-users', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: true,
                    noStudentUsers: false,
                    studentUsers: sanitizedStudentUsers,
                    noUnverifiedUsers: false,
                    unverifiedUsers: sanitizedUnverifiedUsers
                });

            } else if (studentUsers.length === 0) {
                return res.render('admin-users', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: false,
                    staffUsers: sanitizedStaffUsers,
                    noStudentUsers: true,
                    noUnverifiedUsers: false,
                    unverifiedUsers: sanitizedUnverifiedUsers                    
                });

            } else if (unverifiedUsers.length === 0) {
                return res.render('admin-users', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: false,
                    staffUsers: sanitizedStaffUsers,
                    noStudentUsers: false,
                    studentUsers: sanitizedStudentUsers,
                    noUnverifiedUsers: true
                });
            }

            return res.render('admin-users', {
                title: 'SandwichFiller - Manage users',
                noStaffUsers: false,
                staffUsers: sanitizedStaffUsers,
                noStudentUsers: false,
                studentUsers: sanitizedStudentUsers,
                noUnverifiedUsers: false,
                unverifiedUsers: sanitizedUnverifiedUsers
            });
        })
        .catch((e) => {
            console.log(e);
        });    
});

// To grant a staff account permission
router.put('/users/verify/:id', checkIsAuthenticated, checkIsAdmin, async (req, res) => {
    let userId = stringEscape(req.params.id);

    let q = 'SET SEARCH_PATH TO sf; ' +
    'UPDATE users ' +
    'SET ' +
    'is_staff = true ' +
    `WHERE user_id = ${userId}`;

    console.log(q);

    await pool
        .query(q)
        .then(() => {            
            res.redirect('/admin/users');
        })
        .catch((e) => {
            console.log(e);
        })
});

// To deny a staff account permission
router.put('/users/deny/:id', checkIsAuthenticated, checkIsAdmin, async (req, res) => {
    let userId = stringEscape(req.params.id);

    let q = 'SET SEARCH_PATH TO sf; ' +
    'UPDATE users ' +
    'SET ' +
    'is_staff = false ' +
    `WHERE user_id = ${userId};`;

    await pool
        .query(q)
        .then(() => {            
            res.redirect('/admin/users');
        })
        .catch((e) => {
            console.log(e);
        })
});

// To remove an unverified user
router.delete('/users/remove/:id', checkIsAuthenticated, checkIsAdmin, async (req, res) => {
    let userId = stringEscape(req.params.id);

    let q = 'SET SEARCH_PATH TO sf; ' +
    'DELETE FROM users ' +
    `WHERE user_id = ${userId};`;

    await pool
        .query(q)
        .then(() => {            
            res.redirect('/admin/users');
        })
})

// To render manage admin profile page
router.get('/account', checkIsAuthenticated, checkIsAdmin, async (req, res) => {
    const userId = stringEscape(req.session.passport.user);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE getAdminAccount(bigint) AS '
    + 'SELECT staff.user_id, staff.f_name, staff.l_name, staff.email '
    + 'FROM staff '
    + 'WHERE staff.user_id = $1;'
    + `EXECUTE getAdminAccount(${userId});`
    + 'DEALLOCATE getAdminAccount;'

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);
            
            const accDetails = results[2].rows;
            console.log(accDetails);

            const accDetailsFeatures = ['user_id', 'f_name', 'l_name', 'email'];
            const sanitizedAccDetails = resultsHtmlEscape(accDetails, accDetailsFeatures, ['user_id']);

            res.render('admin-manage', {
                title: 'Manage my account',
                error: false,
                accDetails: sanitizedAccDetails
            });
        })
    .catch((e) => {
        console.log(e);
    })
});

// To render admin change password page
router.get('/account/password', checkIsAuthenticated, checkIsAdmin, (req, res) => {
    res.render('admin-changepw', {
        title: 'Admin - Change password'
    });
});

// To change admin password
router.put('/account/password', checkIsAuthenticated, checkIsAdmin,
    body('newpw', 'Password must be at least 8 characters in length').isLength({ min: 8 }),
    body('confirmnewpw').custom((value, { req }) => {
        if (value !== stringEscape(req.body.newpw)) {
            throw new Error('Passwords do not match!');
        }
        return true;
    }),
    
    async (req, res) => {
    const currentPw = stringEscape(req.body.currentpw);
    const newPw = stringEscape(req.body.newpw);
    const userId = stringEscape(req.session.passport.user);

    const errors = validationResult(req);

    const qGetPw = 'SET SEARCH_PATH TO sf; '
    + 'PREPARE getPassword(bigint) AS '
    + 'SELECT users.password '
    + 'FROM users '
    + 'WHERE user_id = $1; '
    + `EXECUTE getPassword(${userId}); `
    + 'DEALLOCATE getPassword;';

    if (!errors.isEmpty()) {
        return res.render('admin-changepw', {
            title: 'Admin - Change password',
            error: errors.errors[0].msg
        });
    }

    await pool
        .query(qGetPw)
        .then((results) => {
            const currentPwHashed = results[2].rows[0].password;
            bcrypt.compare(currentPw, currentPwHashed, async (err, result) => {
                if (err) {
                    return console.log(err);
                }
                if (result) {
                    if (newPw === currentPw) {
                        return res.render('admin-changepw', {
                            title: 'Admin - Change password',
                            error: 'New password and existing passwords cannot be the same!'
                        });
                    }
                    const newPwHashed = await bcrypt.hash(newPw, 10);
                    const qUpdatePw = 'PREPARE updatePw(text, bigint) AS '
                    + 'UPDATE users '
                    + 'SET password = $1 '
                    + 'WHERE user_id = $2; '
                    + `EXECUTE updatePw('${newPwHashed}', ${userId}); `
                    + 'DEALLOCATE updatePw;';

                    await pool
                        .query(qUpdatePw)
                        .then(() => {
                            res.redirect('/admin/account?success=true');                            
                        })
                        .catch((e) => {
                            console.log(e);
                        })
                } else {
                    res.render('admin-changepw', {
                        title: 'Admin - Change password',
                        error: 'Password entered incorrectly. Please try again!'
                    });
                }
            })
        })
        .catch((e) => {
            console.log(e);
        });
});

// Staff log out
router.delete('/logout', checkIsAuthenticated, checkIsAdmin, (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        res.status(301);
        res.redirect('/home');
    });    
});

module.exports = router;