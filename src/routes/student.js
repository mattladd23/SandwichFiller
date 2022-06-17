// Instantiate express and router
const express = require('express');
const router = express.Router();

// Import db model
const pool = require('../config/db');

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
    + 'SELECT student.f_name, student.l_name, application.role, application.organisation, application.city, '
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
                    result:true,
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

module.exports = router;