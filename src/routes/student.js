// Instantiate express and router
const express = require('express');
const router = express.Router();

// Import db model
const pool = require('../config/db');

// Import other libraries and modules
const methodOverride = require('method-override');
const { checkIsAuthenticated } = require('../middleware/checkAuth');
const { checkIsStudent } = require('../middleware/checkPermission');
const { body, validationResult } = require('express-validator');
const { stringEscape, resultsHtmlEscape } = require('../middleware/escape');
const { sanitizeTime } = require('../middleware/sanitizeTime');

// Middleware
router.use(methodOverride('_method'));

// Render student home page
router.get('/', checkIsAuthenticated, checkIsStudent, (req, res) => {
    res.render('student-dashboard', {
        title: 'SandwichFiller: Students',
        error: false
    });
});

// Get all applications of a student
router.get('/applications', checkIsAuthenticated, checkIsStudent, async (req, res) => {

    const userId = stringEscape(req.session.passport.user);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE userApps(bigint) AS '
    + 'SELECT student.f_name, student.l_name, application.app_id, application.role, application.organisation, application.city, '
    + 'application.country, application.deadline, application.description, application.app_status, '
    + 'application.last_updated '
    + 'FROM student JOIN application '
    + 'ON student.user_id = application.user_id '
    + 'WHERE application.user_id = $1 '
    + 'ORDER BY application.last_updated DESC; '
    + `EXECUTE userApps(${userId});`
    + 'DEALLOCATE userApps;'

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);
            if (results[2].rowCount === 0) {
                res.render('student-applications', {
                    title: 'Your applications',
                    result: false
                })
            } else {
                const apps = results[2].rows;
                console.log(apps);

                res.render('student-applications', {
                    title: 'Your applications',
                    result: true,
                    apps: apps                    
                })
            }
        })
        .catch((e) => {
            console.log(e);
        })
});

// Render create application page
router.get('/applications/new', checkIsAuthenticated, checkIsStudent, (req, res) => {
    res.render('new-application', {
        title: 'Post a new application',
        error: false
    });
});

// Post a new application
router.post('/applications/new', checkIsAuthenticated, checkIsStudent,
    body('role', 'Please keep "Role / programme" to 40 characters or less.').isLength({ max: 40 }),
    body('organisation', 'Please keep "Organisation" to 40 characters or less.').isLength({ max: 40 }),
    body('city', 'Please keep "City" to 40 characters or less.').isLength({ max: 40 }),
    body('country', 'Please keep "Country" to 40 characters or less.').isLength({ max: 40 }),
    body('deadline', 'Please enter a valid application deadline.').isLength({ max: 30 }),    
    body('appstatus').custom((value) => {
        let statusArray = ['Interested', 'Applied', 'Online tests', 'Assessment centre', 'Interview', 'Accepted', 'Rejected'];
        if (!statusArray.includes(value)) {
            throw new Error('Please select an application status from the list!')
        }
        return true
    }),
    body('description', 'Please keep your description to 140 characters or less.').isLength({ max: 140}), 

    async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('new-application', {
            title: 'Post a new application',
            error: true,
            errorMsg: errors.errors[0].msg
        })
    }

    const userId = stringEscape(req.session.passport.user);    
    const appId = Date.now().toString();
    const role = stringEscape(req.body.role);
    const organisation = stringEscape(req.body.organisation);
    const city = stringEscape(req.body.city);
    const country = stringEscape(req.body.country);
    const deadline = stringEscape(req.body.deadline);
    const appStatus = stringEscape(req.body.appstatus);
    const description = stringEscape(req.body.description);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE newApp(bigint, bigint, text, text, text, text, date, text, text, text) AS '
    + 'INSERT INTO application(user_id, app_id, role, organisation, city, country, deadline, description, app_status, last_updated)'
    + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, LOCALTIMESTAMP(0));'
    + `EXECUTE newApp(${userId}, ${appId}, '${role}', '${organisation}', '${city}', '${country}', '${deadline}', '${description}', '${appStatus}', 1);`
    + 'DEALLOCATE newApp;'

    console.log(q);
    
    await pool
        .query(q)
        .then(() => {
            res.redirect('/student/applications');
        })
        .catch((e) => {
            console.log(e);
        })
});

// Render edit applications page
router.get('/applications/update', checkIsAuthenticated, checkIsStudent, async (req, res) => {

    const userId = stringEscape(req.session.passport.user);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE getStudentApps(bigint) AS '
    + 'SELECT student.f_name, student.l_name, application.app_id, application.role, application.organisation, '
    + 'application.city, application.country, application.deadline, application.description, '
    + 'application.app_status, application.last_updated '
    + 'FROM student JOIN application '
    + 'ON student.user_id = application.user_id '
    + 'WHERE application.user_id = $1 '
    + 'ORDER BY application.last_updated DESC; '
    + `EXECUTE getStudentApps(${userId});`
    + 'DEALLOCATE getStudentApps;'

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);
            if (results[2].rowCount === 0) {
                res.render('update-applications', {
                    title: 'Your applications',
                    result: false
                })
            } else {
                const apps = results[2].rows;
                console.log(apps);

                res.render('update-applications', {
                    title: 'Your applications',
                    result: true,
                    apps: apps                    
                })
            }
        })
        .catch((e) => {
            console.log(e);
        })
});

// Edit an application(s)
router.put('/applications/update/:id', checkIsAuthenticated, checkIsStudent, 
    body('appstatus').custom((value) => {
        let statusArray = ['Interested', 'Applied', 'Online tests', 'Assessment centre', 'Interview', 'Accepted', 'Rejected'];
        if (!statusArray.includes(value)) {
            throw new Error('Please select an application status from the list!')
        }
        return true
    }),
    body('description', 'Please keep your description to 140 characters or less.').isLength({ max: 140}),
    
    async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('update-applications', {
            title: 'Your applications',
            error: true,
            errorMsg: errors.errors[0].msg
        })
    }
        
    const appStatus = stringEscape(req.body.updateAppStatus);
    const description = stringEscape(req.body.updateDesc);
    const appId = stringEscape(req.params.id);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE updateApp(text, text, timestamp, bigint) AS '
    + 'UPDATE application '
    + 'SET app_status = $1, description = $2, last_updated = $3'
    + 'WHERE app_id = $4; '
    + `EXECUTE updateApp('${appStatus}', '${description}', LOCALTIMESTAMP, ${appId});`
    + 'DEALLOCATE updateApp;'

    console.log(q);

    await pool
        .query(q)
        .then(() => {
            res.redirect('/student/applications');
        })
    .catch((e) => {
        console.log(e);
    })    
});

// Delete an application
router.delete('/applications/update/:id', checkIsAuthenticated, checkIsStudent, async (req, res) => {
    
    const appId = stringEscape(req.params.id);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE deleteApp(bigint) AS '
    + 'DELETE FROM application '
    + 'WHERE application.app_id = $1; '
    + `EXECUTE deleteApp(${appId});`
    + 'DEALLOCATE deleteApp;'

    await pool
        .query(q)
        .then(() => {
            return res.redirect('/student/applications');
        })
    .catch((e) => {
        console.log(e);
    })
});

// Render student manage profile page
router.get('/account', checkIsAuthenticated, checkIsStudent, async (req, res) => {

    const userId = stringEscape(req.session.passport.user);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE getAccount(bigint) AS '
    + 'SELECT student.f_name, student.l_name, student.email, student.student_id, student.course, '
    + 'student.school, student.placement_year, student.grad_year, student.pref_sector, student.other_sectors '
    + 'FROM student '
    + 'WHERE student.user_id = $1;'
    + `EXECUTE getAccount(${userId});`
    + 'DEALLOCATE getAccount;'

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);
            const accDetails = results[2].rows;
            console.log(accDetails);
            res.render('student-manage', {
                title: 'Manage my account',
                error: false,
                accDetails: accDetails
            });
        })
    .catch((e) => {
        console.log(e);
    })
})

// Edit student account details
router.put('/account', checkIsAuthenticated, checkIsStudent, async (req, res) => {
    
    const studentId = stringEscape(req.body.studentid);
    const course = stringEscape(req.body.course);
    const school = stringEscape(req.body.school);
    const placementYear = stringEscape(req.body.placementyear);
    const gradYear = stringEscape(req.body.gradyear);
    const prefSector = stringEscape(req.body.prefsector);
    const otherSectors = stringEscape(req.body.othersectors);
    const userId = stringEscape(req.session.passport.user);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE editAccount(bigint, text, text, text, int, text, text, bigint) AS '
    + 'UPDATE student '
    + 'SET student_id = $1, course = $2, school = $3, placement_year = $4, '
    + 'grad_year = $5, pref_sector = $6, other_sectors = $7 '
    + 'WHERE user_id = $8;'
    + `EXECUTE editAccount(${studentId}, '${course}', '${school}', '${placementYear}', '${gradYear}', '${prefSector}', `
    + `'${otherSectors}', ${userId});`
    + 'DEALLOCATE editAccount;'

    await pool
        .query(q)
        .then(() => {
            res.redirect('/student');
        })
    .catch((e) => {
        console.log(e);
    })
});

// Student log out
router.delete('/logout', checkIsAuthenticated, checkIsStudent, (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        res.status(301);
        res.redirect('/home');
    });    
});

module.exports = router;