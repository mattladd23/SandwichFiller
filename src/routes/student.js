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
// const { sanitizeTime } = require('../middleware/sanitizeTime');
const bcrypt = require('bcrypt');

// Middleware
router.use(methodOverride('_method'));

// Time sanitization to remove time and time zone from applicationd dealine and last updated
const sanitizeTime = (results, deadline, updated) => {
    for (let i = 0; i < results.length; i++) {
        let deadlineResult = results[i][deadline];
        deadlineResult = deadlineResult.toString();
        deadlineResult = deadlineResult.split('00:');
        results[i][deadline] = deadlineResult[0];

        let updatedResult = results[i][updated];
        updatedResult = updatedResult.toString();
        updatedResult = updatedResult.split('GMT');
        results[i][updated] = updatedResult[0];
    }
    return results;
};

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
    + 'SELECT student.user_id, student.f_name, student.l_name, application.app_id, application.role, '
    + 'application.organisation, application.city, application.country, application.deadline, '
    + 'application.description, application.app_status, application.last_updated '
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

                const appFeatures = ['user_id', 'f_name', 'l_name', 'app_id', 'role', 'organisation', 'city',
                                     'country','deadline', 'description', 'app_status', 'last_updated'];                                 
                let sanitizedApps = resultsHtmlEscape(apps, appFeatures, ['deadline', 'last_updated']);
                sanitizedApps = sanitizeTime(sanitizedApps, 'deadline', 'last_updated');

                res.render('student-applications', {
                    title: 'Your applications',
                    result: true,
                    apps: sanitizedApps                    
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
    + 'SELECT student.user_id, student.f_name, student.l_name, application.app_id, application.role, '
    + 'application.organisation, application.city, application.country, application.deadline, '
    + 'application.description, application.app_status, application.last_updated '
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

                const appFeatures = ['user_id', 'f_name', 'l_name', 'app_id', 'role', 'organisation', 'city',
                                     'country','deadline', 'description', 'app_status', 'last_updated'];                                 
                let sanitizedApps = resultsHtmlEscape(apps, appFeatures, ['deadline', 'last_updated']);
                sanitizedApps = sanitizeTime(sanitizedApps, 'deadline', 'last_updated');

                res.render('update-applications', {
                    title: 'Your applications',
                    result: true,
                    apps: sanitizedApps                    
                })
            }
        })
        .catch((e) => {
            console.log(e);
        })
});

// Edit an application(s)
router.put('/applications/update/:id', checkIsAuthenticated, checkIsStudent,
    body('updateappstatus').custom((value) => {
        let statusArray = ['Interested', 'Applied', 'Online tests', 'Assessment centre', 'Interview', 'Accepted', 'Rejected'];
        if (!statusArray.includes(value)) {
            throw new Error('Please select an application status from the list!')
        }
        return true;
    }),
    body('updatedesc', 'Please keep your description to 140 characters or less.').isLength({ max: 140}),
    
    async (req, res) => {
    const appStatus = stringEscape(req.body.updateappstatus);
    const description = stringEscape(req.body.updatedesc);
    const appId = stringEscape(req.params.id);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE updateApp(text, text, timestamp, bigint) AS '
    + 'UPDATE application '
    + 'SET app_status = $1, description = $2, last_updated = $3'
    + 'WHERE app_id = $4; '
    + `EXECUTE updateApp('${appStatus}', '${description}', LOCALTIMESTAMP, ${appId});`
    + 'DEALLOCATE updateApp;'

    console.log(q);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('update-applications', {
            title: 'Your applications',
            error: true,
            errorMsg: errors.errors[0].msg
        })
    }      

    

    await pool
        .query(q)
        .then(() => {
            res.redirect('/student/applications?success=true');
            // res.render('student-applications', {
            //     title: 'Your applications',
            //     result: true,
            //     error: false
            // });
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
    + 'SELECT student.user_id, student.f_name, student.l_name, student.email, student.student_id, student.course, '
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

            const accDetailsFeatures = ['user_id', 'f_name', 'l_name', 'email', 'student_id', 'course', 'school',
                                        'placement_year', 'grad_year', 'pref_sector', 'other_sectors'];
            const sanitizedAccDetails = resultsHtmlEscape(accDetails, accDetailsFeatures, ['user_id']);

            res.render('student-manage', {
                title: 'Manage my account',
                error: false,
                accDetails: sanitizedAccDetails
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
            res.redirect('/student?success=true');
        })
    .catch((e) => {
        console.log(e);
    })
});

// To render student change password page
router.get('/account/password', checkIsAuthenticated, checkIsStudent, (req, res) => {
    res.render('student-changepw', {
        title: 'Student - Change password'
    });
});

// To change staff password
router.put('/account/password', checkIsAuthenticated, checkIsStudent,
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
        return res.render('student-changepw', {
            title: 'Student - Change password',
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
                        return res.render('student-changepw', {
                            title: 'Student - Change password',
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
                            res.redirect('/student/account?success=true');                            
                        })
                        .catch((e) => {
                            console.log(e);
                        })
                } else {
                    res.render('student-changepw', {
                        title: 'Student - Change password',
                        error: 'Password entered incorrectly. Please try again!'
                    });
                }
            })
        })
        .catch((e) => {
            console.log(e);
        });
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