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
                return res.render('admin-manage', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: true,
                    noStudentUsers: true,
                    noUnverifiedUsers: true
                });

            } else if (studentUsers.length === 0 && unverifiedUsers.length === 0) {
                return res.render('admin-manage', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: false,
                    staffUsers: sanitizedStaffUsers,
                    noStudentUsers: true,
                    noUnverifiedUsers: true
                });

            } else if (staffUsers.length === 0 && unverifiedUsers.length === 0) {
                return res.render('admin-manage', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: true,
                    noStudentUsers: false,
                    studentUsers: sanitizedStudentUsers,
                    noUnverifiedUsers: true
                });

            } else if (staffUsers.length === 0 && studentUsers.length === 0) {
                return res.render('admin-manage', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: true,
                    noStudentUsers: true,
                    noUnverifiedUsers: false,
                    unverifiedUsers: sanitizedUnverifiedUsers
                });

            } else if (staffUsers.length === 0) {
                return res.render('admin-manage', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: true,
                    noStudentUsers: false,
                    studentUsers: sanitizedStudentUsers,
                    noUnverifiedUsers: false,
                    unverifiedUsers: sanitizedUnverifiedUsers
                });

            } else if (studentUsers.length === 0) {
                return res.render('admin-manage', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: false,
                    staffUsers: sanitizedStaffUsers,
                    noStudentUsers: true,
                    noUnverifiedUsers: false,
                    unverifiedUsers: sanitizedUnverifiedUsers                    
                });

            } else if (unverifiedUsers.length === 0) {
                return res.render('admin-manage', {
                    title: 'SandwichFiller - Manage users',
                    noStaffUsers: false,
                    staffUsers: sanitizedStaffUsers,
                    noStudentUsers: false,
                    studentUsers: sanitizedStudentUsers,
                    noUnverifiedUsers: true
                });
            }

            return res.render('admin-manage', {
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

module.exports = router;