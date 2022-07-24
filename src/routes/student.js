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

// Define search path variable for development environment
let searchPath = 'SET SEARCH_PATH TO sf; ';

// Define search path variable for testing environment to access test database
if (process.env.NODE_ENV === 'test') {
    searchPath = 'SET SEARCH_PATH TO sf_test; ';
}

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
        title: 'SandwichFiller: Students'
    });
});

// Get all applications of a student
router.get('/applications', checkIsAuthenticated, checkIsStudent, async (req, res) => {

    const userId = stringEscape(req.session.passport.user);

    let q = searchPath
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
                    apps: sanitizedApps,
                    success: req.query.success                    
                })
            }
        })
        .catch((e) => {
            console.log(e);
        })
});

// Render create application page
router.get('/applications/new', checkIsAuthenticated, checkIsStudent, (req, res) => {
    res.render('student-new-application', {
        title: 'Post a new application',
        error: req.query.error,
        success: req.query.success
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
        return res.render('student-new-application', {
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

    let q = searchPath
    + 'PREPARE newApp(bigint, bigint, text, text, text, text, date, text, text, text) AS '
    + 'INSERT INTO application(user_id, app_id, role, organisation, city, country, deadline, description, app_status, last_updated)'
    + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, LOCALTIMESTAMP(0));'
    + `EXECUTE newApp(${userId}, ${appId}, '${role}', '${organisation}', '${city}', '${country}', '${deadline}', '${description}', '${appStatus}', 1);`
    + 'DEALLOCATE newApp;'

    console.log(q);
    
    await pool
        .query(q)
        .then(() => {
            // res.redirect('/student/applications');
            res.render('student-new-application', {
                title: 'Post a new application',
                success: true, 
                successMsg: 'Application created successfully!' 
            });
        })
        .catch((e) => {
            console.log(e);
        })
});

// Render edit applications page
router.get('/applications/update', checkIsAuthenticated, checkIsStudent, async (req, res) => {

    const userId = stringEscape(req.session.passport.user);

    let q = searchPath
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
                res.render('student-update-applications', {
                    title: 'Your applications',
                    result: false,
                    success: req.query.success
                })
            } else {
                const apps = results[2].rows;
                console.log(apps);

                const appFeatures = ['user_id', 'f_name', 'l_name', 'app_id', 'role', 'organisation', 'city',
                                     'country','deadline', 'description', 'app_status', 'last_updated'];                                 
                let sanitizedApps = resultsHtmlEscape(apps, appFeatures, ['deadline', 'last_updated']);
                sanitizedApps = sanitizeTime(sanitizedApps, 'deadline', 'last_updated');

                res.render('student-update-applications', {
                    title: 'Your applications',
                    result: true,
                    apps: sanitizedApps,
                    error: req.query.error,
                    success: req.query.success                  
                });
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

    let q = searchPath
    + 'PREPARE updateApp(text, text, timestamp, bigint) AS '
    + 'UPDATE application '
    + 'SET app_status = $1, description = $2, last_updated = $3'
    + 'WHERE app_id = $4; '
    + `EXECUTE updateApp('${appStatus}', '${description}', LOCALTIMESTAMP, ${appId});`
    + 'DEALLOCATE updateApp;'

    console.log(q);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('student-update-applications', {
            title: 'Your applications',
            error: true,
            errorMsg: errors.errors[0].msg
        })
    }   
    await pool
        .query(q)
        .then(() => {
            res.redirect('/student/applications?success=true');
        })
    .catch((e) => {
        console.log(e);
    })    
});

// Delete an application
router.delete('/applications/update/:id', checkIsAuthenticated, checkIsStudent, async (req, res) => {
    
    const appId = stringEscape(req.params.id);

    let q = searchPath
    + 'PREPARE deleteApp(bigint) AS '
    + 'DELETE FROM application '
    + 'WHERE application.app_id = $1; '
    + `EXECUTE deleteApp(${appId});`
    + 'DEALLOCATE deleteApp;'

    await pool
        .query(q)
        .then(() => {
            res.redirect('/student/applications/update?success=true');
        })
    .catch((e) => {
        console.log(e);
    })
});

// Render student manage profile page
router.get('/account', checkIsAuthenticated, checkIsStudent, async (req, res) => {

    const userId = stringEscape(req.session.passport.user);

    let q = searchPath
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
                accDetails: sanitizedAccDetails,
                error: req.query.error,
                success: req.query.success
            });
        })
    .catch((e) => {
        console.log(e);
    })
})

// Edit student account details
router.put('/account', checkIsAuthenticated, checkIsStudent,
    body('course', 'Please keep course name to 50 characters or less!').isLength({ max: 50 }),
    body('othersectors', 'Please keep "other sectors" to 100 characters or less!').isLength({ max: 100 }),
    
    async (req, res) => {
    
    // Error handlers
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('student-manage', {
            title: 'Manage my account',
            error: true,
            errorMsg: errors.errors[0].msg
        });
    }
    
    const studentId = stringEscape(req.body.studentid);
    const course = stringEscape(req.body.course);
    const school = stringEscape(req.body.school);
    const placementYear = stringEscape(req.body.placementyear);
    const gradYear = stringEscape(req.body.gradyear);
    const prefSector = stringEscape(req.body.prefsector);
    const otherSectors = stringEscape(req.body.othersectors);
    const userId = stringEscape(req.session.passport.user);

    let q = searchPath
    + 'PREPARE editAccount(bigint, text, text, text, int, text, text, bigint) AS '
    + 'UPDATE student '
    + 'SET student_id = $1, course = $2, school = $3, placement_year = $4, '
    + 'grad_year = $5, pref_sector = $6, other_sectors = $7 '
    + 'WHERE user_id = $8;'
    + `EXECUTE editAccount(${studentId}, '${course}', '${school}', '${placementYear}', '${gradYear}', '${prefSector}', `
    + `'${otherSectors}', ${userId});`
    + 'DEALLOCATE editAccount;'

    console.log(q);

    await pool
        .query(q)
        .then(() => {
            // res.redirect('/student?success=true');
            res.render('student-manage', {
                title: 'Manage my account',
                success: true,
                successMsg: 'Account updated successfully!'
            })
        })
    .catch((e) => {
        console.log(e);
    })
});

// To render student change password page
router.get('/account/password', checkIsAuthenticated, checkIsStudent, (req, res) => {
    res.render('student-changepw', {
        title: 'Student - Change password',
        error: req.query.error,
        success: req.query.success
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

    const qGetPw = searchPath
    + 'PREPARE getPassword(bigint) AS '
    + 'SELECT users.password '
    + 'FROM users '
    + 'WHERE user_id = $1; '
    + `EXECUTE getPassword(${userId}); `
    + 'DEALLOCATE getPassword;';

    if (!errors.isEmpty()) {
        return res.render('student-changepw', {
            title: 'Student - Change password',
            error: true,
            errorMsg: errors.errors[0].msg
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
                        res.render('student-changepw', {
                            title: 'Student - Change password',
                            error: true,
                            errorMsg: 'New password and existing passwords cannot be the same!'
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
                            // res.redirect('/student/account?success=true');
                            res.render('student-changepw', {
                                title: 'Student - Change password',
                                success: true,
                                successMsg: 'Password changed successfully!'
                            })                         
                        })
                        .catch((e) => {
                            console.log(e);
                        })
                } else {
                    res.render('student-changepw', {
                        title: 'Student - Change password',
                        error: true,
                        errorMsg: 'Password entered incorrectly. Please try again!'
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