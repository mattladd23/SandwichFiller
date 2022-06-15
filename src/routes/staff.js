// Instantiate express and router
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Import database model
const pool = require('../config/db');

// Render login success page
router.get('/', (req, res) => {
    res.render('staff-welcome', {
        title: 'Welcome Staff',
        error: false
    });
});

// Get all applications
router.get('/applications', async (req, res) => {

    // Import to decide whether prepared or not as will need to use string escape for prepared 
    let prepared = false

    // Default query to return all posts ordered by date last updated
    // let q = 'SET SEARCH_PATH TO sf;'
    // + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city '
    // + 'application.country, application.app_date, application.deadline, application.description, application.app_status '
    // + 'application.last_updated, users.user_id, users.f_name, users.l_name '
    // + 'FROM application JOIN users ON post.user_id = users.user_id '
    // + 'ORDER BY application.last_updated DESC;'

    // Query without join prior to setting up user sessions for testing
    let q = 'SET SEARCH_PATH TO sf;'
    + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city '
    + 'application.country, application.app_date, application.deadline, application.description, application.app_status '
    + 'application.last_updated '
    + 'FROM application '
    + 'ORDER BY application.last_updated DESC;'

    if (req.query.filter) {
        if (req.query.filter === 'All applications') {
            // q = 'SET SEARCH_PATH TO sf;'
            // + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city '
            // + 'application.country, application.app_date, application.deadline, application.description, application.app_status '
            // + 'application.last_updated, users.user_id, users.f_name, users.l_name '
            // + 'FROM application JOIN users ON post.user_id = users.user_id '
            // + 'ORDER BY application.last_updated DESC;'
            
            // Query without join prior to setting up user sessions for testing
            q = 'SET SEARCH_PATH TO sf;'
            + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city '
            + 'application.country, application.app_date, application.deadline, application.description, application.app_status '
            + 'application.last_updated'
            + 'FROM application '
            + 'ORDER BY application.last_updated DESC;'
            
        } else {
            prepared = true;

            // q = 'SET SEARCH_PATH TO sf;'
            // + 'PREPARE filter(text) AS '
            // + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city '
            // + 'application.country, application.app_date, application.deadline, application.description, application.app_status '
            // + 'application.last_updated, users.user_id, users.f_name, users.l_name '
            // + 'FROM application JOIN users ON post.user_id = users.user_id '
            // + 'WHERE application.app_status = $1 '
            // + 'ORDER BY application.last_updated DESC;'
            // + `EXECUTE filter('${req.query.filter}');`
            // + 'DEALLOCATE filter;'
            
            // Query without join prior to setting up user sessions for testing
            q = 'SET SEARCH_PATH TO sf;'
            + 'PREPARE filter(text) AS '
            + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city '
            + 'application.country, application.app_date, application.deadline, application.description, application.app_status '
            + 'application.last_updated '
            + 'FROM application '
            + 'WHERE application.app_status = $1 '
            + 'ORDER BY application.last_updated DESC;'
            + `EXECUTE filter('${req.query.filter}');`
            + 'DEALLOCATE filter;'
        }
    }
    
    await pool
        .query(q)
        .then((results) => {
            const statusArray = results[1].rows;
            if (prepared) {
                for (let i = statusArray.length -1; i >= 0; i--) {
                    if (statusArray[i].ptags === req.query.filter) {
                        filterArray.splice(i, 1);
                    }
                }

                const apps = results[3].rows
                if (apps.length === 0) {
                    return res.render('all-applications', {
                        title: 'Applications',
                        filter: req.query.filter,
                        noSort: false,
                        status: statusArray,
                        noApps: true
                    })
                }

                const appFeatures = ['role', 'organisation', 'city', 'country', 'app_date', 
                                     'deadline', 'description', 'app_status', 'last_updated'];
                let appResults = [apps, appFeatures, ['last_updated']];
                sanAppResults = [appResults, 'last_updated'];

                return res.render('all-applications', {
                    title: 'Applications',
                    apps: sanAppResults,
                    filter: req.query.filter,
                    noSort: false,
                    status: statusArray
                })
                        
            }
            const apps = results[2].rows;
            const appFeatures = ['role', 'organisation', 'city', 'country', 'app_date', 
                                     'deadline', 'description', 'app_status', 'last_updated'];
            let appResults = [apps, appFeatures, ['last_updated']];
            sanAppResults = [appResults, 'last_updated'];

            return res.render('all-applications', {
                title: 'Applications',
                apps: sanAppResults,
                noSort: false,
                status: statusArray
            })            
        })
        .catch((e) => {
            console.log(e);
        })
})

module.exports = router;