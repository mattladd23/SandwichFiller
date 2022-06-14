// Instantiate express and router
const express = require('express');
const router = express.Router();

// Import db model
const pool = require('../config/db');

// Render student home page
router.get('/', (req, res) => {
    res.render('student-welcome', {
        title: 'Welcome Student',
        error: false
    });
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
    // const userId = parseInt(req.session.passport.user.user_id);
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
    + 'PREPARE newApp(bigint, text, text, text, text, date, date, text, text, text) AS '
    + 'INSERT INTO application(app_id, role, organisation, city, country, app_date, deadline, description, app_status, last_updated)'
    + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, LOCALTIMESTAMP(0));'
    + `EXECUTE newApp(${appId}, '${role}', '${organisation}', '${city}', '${country}', '${appDate}', '${deadline}', '${description}', '${appStatus}', 1);`
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