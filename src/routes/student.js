// Instantiate express and router
const express = require('express');
const router = express.Router();

// Import db model
const pool = require('../config/db');

// Other modules
const methodOverride = require('method-override');

// Middleware
router.use(methodOverride('_method'));

// Render student home page
router.get('/', (req, res) => {
    res.render('student-dashboard', {
        title: 'SandwichFiller: Students',
        error: false
    });
});

// Get all applications of a student
router.get('/applications', async (req, res) => {

    let userId = req.session.passport.user;

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE userApps(bigint) AS '
    + 'SELECT student.f_name, student.l_name, application.app_id, application.role, application.organisation, application.city, '
    + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
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
router.get('/applications/new', (req, res) => {
    res.render('new-application', {
        title: 'Post a new application',
        error: false
    });
});

// Post a new application
router.post('/applications/new', async (req, res) => {

    const userId = req.session.passport.user;    
    const appId = Date.now().toString();
    const role = req.body.role;
    const organisation = req.body.organisation;
    const city = req.body.city;
    const country = req.body.country;
    const appDate = req.body.appdate;
    const deadline = req.body.deadline;
    const appStatus = req.body.appstatus;
    const description = req.body.description;

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE newApp(bigint, bigint, text, text, text, text, date, date, text, text, text) AS '
    + 'INSERT INTO application(user_id, app_id, role, organisation, city, country, app_date, deadline, description, app_status, last_updated)'
    + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, LOCALTIMESTAMP(0));'
    + `EXECUTE newApp(${userId}, ${appId}, '${role}', '${organisation}', '${city}', '${country}', '${appDate}', '${deadline}', '${description}', '${appStatus}', 1);`
    + 'DEALLOCATE newApp;'
    
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

router.get('/applications/edit', async (req, res) => {

    let userId = req.session.passport.user;

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE userApps(bigint) AS '
    + 'SELECT student.f_name, student.l_name, application.app_id, application.role, application.organisation, application.city, '
    + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
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
                res.render('edit-applications', {
                    title: 'Your applications',
                    result: false
                })
            } else {
                const apps = results[2].rows;
                console.log(apps);

                res.render('edit-applications', {
                    title: 'Your applications',
                    result:true,
                    apps: apps                    
                })
            }
        })
        .catch((e) => {
            console.log(e);
        })
});

// Edit an application(s)
router.put('/applications/edit/:id', async (req, res) => {
        
    const appId = req.params.id;
    const role = req.body.editRole;
    const organisation = req.body.editOrganisation;
    const city = req.body.editCity;
    const country = req.body.editCountry;
    const appDate = req.body.editAppDate;
    const deadline = req.body.editDeadline;
    const appStatus = req.body.editAppStatus;
    const description = req.body.editDescription;

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE editApp(text, text, text, text, text, text, text, text, bigint) AS '
    + 'UPDATE application '
    + 'SET role = $1, organisation = $2, city = $3, country = $4, app_date = $5, '
    + 'deadline = $6, app_status = $7, description = $8 '
    + 'WHERE app_id = $9;'
    + `EXECUTE editApp('${role}', '${organisation}', '${city}', '${country}', '${appDate}', '${deadline}', `
    + `'${appStatus}', '${description}', ${appId});`
    + 'DEALLOCATE editApp;'

    console.log(q);

    await pool
        .query(q)
        .then(() => {
            return res.redirect('/student/applications?success=true');
        })
    .catch((e) => {
        console.log(e);
    })    
});

// Delete an application
router.delete('/applications/edit/:id', async (req, res) => {
    
    const appId = req.params.id;

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

// router.get('/account', (req, res) => {
//     res.render('student-manage', {
//         title: 'Manage my account',
//         error: false
//     })
// });


router.get('/account', async (req, res) => {

    const userId = req.session.passport.user;

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

router.put('/account', async (req, res) => {
    
    const studentId = req.body.studentid;
    const course = req.body.course;
    const school = req.body.school;
    const placementYear = req.body.placementyear;
    const gradYear = req.body.gradyear;
    const prefSector = req.body.prefsector;
    const otherSectors = req.body.othersectors;
    const userId = req.session.passport.user;

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
})

module.exports = router;