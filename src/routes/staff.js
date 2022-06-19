// Instantiate express and router
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Import database model
const pool = require('../config/db');

// Other modules
const methodOverride = require('method-override');

// Middleware
router.use(methodOverride('_method'));

// Render login success page
router.get('/', (req, res) => {
    res.render('staff-dashboard', {
        title: 'SandwichFiller :: Staff',
        error: false
    });
});

// Get all applications
router.get('/applications', async (req, res) => {

    let q = 'SET SEARCH_PATH TO sf;'    
    + 'SELECT DISTINCT application.app_status FROM application;'

    // Import to decide whether prepared or not as will need to use string escape for prepared 
    let prepared = false;
    console.log(`Prepared: ${prepared}`);

    if (Object.keys(req.query).length === 0) {
        // Default query to return all posts ordered by date last updated
        // q += 'SET SEARCH_PATH TO sf;'
        // + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
        // + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
        // + 'application.last_updated, users.user_id, users.f_name, users.l_name '
        // + 'FROM application JOIN users ON post.user_id = users.user_id '
        // + 'ORDER BY application.last_updated DESC;'

        // Query without join prior to setting up user sessions for testing
        q += 'SET SEARCH_PATH TO sf;'
        + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
        + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
        + 'application.last_updated '
        + 'FROM application '
        + 'ORDER BY application.last_updated DESC;'
        console.log(q);

    } else {        

        if (req.query.filter) {
            console.log(req.query.filter);
            if (req.query.filter === 'All applications') {
                console.log(req.query.filter)
                // q = 'SET SEARCH_PATH TO sf;'
                // + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
                // + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
                // + 'application.last_updated, users.user_id, users.f_name, users.l_name '
                // + 'FROM application JOIN users ON post.user_id = users.user_id '
                // + 'ORDER BY application.last_updated DESC;'
                
                // Query without join prior to setting up user sessions for testing
                q += 'SET SEARCH_PATH TO sf;'
                + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
                + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
                + 'application.last_updated '
                + 'FROM application '
                + 'ORDER BY application.last_updated DESC;'
                console.log(q);
                
            } else {
                prepared = true;
                console.log(`Prepared: ${prepared}`);
                console.log(req.query.filter);

                // q = 'SET SEARCH_PATH TO sf;'
                // + 'PREPARE filter(text) AS '
                // + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
                // + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
                // + 'application.last_updated, users.user_id, users.f_name, users.l_name '
                // + 'FROM application JOIN users ON post.user_id = users.user_id '
                // + 'WHERE application.app_status = $1 '
                // + 'ORDER BY application.last_updated DESC;'
                // + `EXECUTE filter('${req.query.filter}');`
                // + 'DEALLOCATE filter;'
                
                // Query without join prior to setting up user sessions for testing
                q += 'SET SEARCH_PATH TO sf;'
                + 'PREPARE filter(text) AS '
                + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
                + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
                + 'application.last_updated '
                + 'FROM application '
                + 'WHERE application.app_status = $1 '
                + 'ORDER BY application.last_updated DESC;'
                + `EXECUTE filter('${req.query.filter}');`
                + 'DEALLOCATE filter;'
                console.log(q);
            }
        }        
    }    
    
    await pool
        .query(q)        
        .then((results) => {
            console.log(results);

            const statusArray = results[1].rows;
            console.log(statusArray);

            if (prepared) {
                for (let i = statusArray.length -1; i >= 0; i--) {
                    if (statusArray[i] === req.query.filter) {
                        filterArray.splice(i, 1);
                    }
                }

                const apps = results[4].rows
                console.log(apps);

                if (apps.length === 0) {
                    return res.render('all-applications', {
                        title: 'Applications',
                        filter: req.query.filter,
                        noFilter: false,
                        status: statusArray,
                        noApps: true
                    });
                }

                // Keep lines below for input sanitisation

                // const appFeatures = ['role', 'organisation', 'city', 'country', 'app_date', 
                //                      'deadline', 'description', 'app_status', 'last_updated'];
                // let appResults = [apps, appFeatures, ['last_updated']];
                // sanAppResults = [appResults, 'last_updated'];
                // console.log(sanAppResults);

                return res.render('all-applications', {
                    title: 'Applications',
                    apps: apps,
                    filter: req.query.filter,
                    noFilter: false,
                    status: statusArray
                });
                        
            }
            const apps = results[3].rows;
            console.log(apps);

            // Keep lines below for input sanitisation

            // const appFeatures = ['role', 'organisation', 'city', 'country', 'app_date', 
            //                          'deadline', 'description', 'app_status', 'last_updated'];
            // let appResults = [apps, appFeatures, ['last_updated']];
            // sanAppResults = [appResults, 'last_updated'];
            // console.log(sanAppResults);

            return res.render('all-applications', {
                title: 'Applications',
                apps: apps,
                noFilter: true,
                status: statusArray
            })            
        })
        .catch((e) => {
            console.log(e);
        });
})

// Search student records

// Render page
router.get('/students', async (req, res) => {
    
    let query = req.query.search;
    console.log(query);

    query = '%'+query+'%';

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE searchStudents(text) AS '
    + 'SELECT student.f_name, student.l_name, student.email, student.student_id, student.course, '
    + 'student.school, student.placement_year, student.grad_year, student.pref_sector, other_sectors '
    + 'FROM student '
    + 'WHERE student.f_name ILIKE $1 OR student.l_name ILIKE $1 OR student.email ILIKE $1 ' 
    + 'ORDER BY student.l_name ASC;'
    + `EXECUTE searchStudents('${query}');`
    + 'DEALLOCATE searchStudents;'

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);
            if (results[2].rowCount === 0) {
                res.render('staff-search-students', {
                    title: 'Find a student',
                    userSearch: query,
                    result: false
                })
            } else {
                const students = results[2].rows;
                console.log(students);

                res.render('search-students', {
                    title: 'Search students',
                    students: students,
                    result: true
                })                
            }
        })
        .catch((e) => {
            console.log(e);
        })
});

// Render student manage profile page
router.get('/account', async (req, res) => {

    const userId = req.session.passport.user;

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE getStaffAccount(bigint) AS '
    + 'SELECT staff.f_name, staff.l_name, staff.email '
    + 'FROM staff '
    + 'WHERE staff.user_id = $1;'
    + `EXECUTE getStaffAccount(${userId});`
    + 'DEALLOCATE getStaffAccount;'

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);
            const accDetails = results[2].rows;
            console.log(accDetails);
            res.render('staff-manage', {
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
router.put('/account', async (req, res) => {
    
    const staffFName = req.body.stafffname;
    const staffLName = req.body.stafflname;
    const staffEmail = req.body.staffemail;
    const userId = req.session.passport.user;

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE editStaffAccount(text, text, text, bigint) AS '
    + 'UPDATE staff '
    + 'SET f_name = $1, l_name = $2, email = $3 '
    + 'WHERE user_id = $4;'
    + `EXECUTE editStaffAccount('${staffFName}', '${staffLName}', '${staffEmail}', ${userId}); `
    + 'DEALLOCATE editStaffAccount';

    await pool
        .query(q)
        .then(() => {
            res.redirect('/staff');
        })
    .catch((e) => {
        console.log(e);
    })
});


// Staff log out
router.delete('/logout', (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        res.status(301);
        res.redirect('/home');
    });    
});

module.exports = router;