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
    let q = 'SET SEARCH_PATH TO SF;'
    let prepared = false

    if (Object.keys(req.query).length === 0) {
        q += 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
        + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
        + 'application.last_updated, student.user_id, student.f_name, student.l_name '
        + 'FROM application JOIN student ON application.user_id = student.user_id '
        + 'ORDER BY application.last_updated DESC;'
        console.log(q);

    } else {
        if (req.query.filter === 'All applications') {
            q += 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
            + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
            + 'application.last_updated, student.user_id, student.f_name, student.l_name '
            + 'FROM application JOIN student ON application.user_id = student.user_id '
            + 'ORDER BY application.last_updated DESC;'
            console.log(q);

        } else {
            q += 'PREPARE filter(text) AS '
            + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
            + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
            + 'application.last_updated, student.user_id, student.f_name, student.l_name '
            + 'FROM application JOIN student ON application.user_id = student.user_id '
            + 'WHERE application.app_status = $1 '
            + 'ORDER BY application.last_updated DESC;'
            + `EXECUTE filter('${req.query.filter}');`
            + 'DEALLOCATE filter;'
            prepared = true;
            console.log(q);
        }
    }

    await pool
        .query(q)
        .then((results) => {

            console.log(results);

            const statusArray = [
                { app_status: 'Interested' },
                { app_status: 'Applied'},
                { app_status: 'Online tests'},
                { app_status: 'Assessment centre'},
                { app_status: 'Interview'},
                { app_status: 'Accepted'},
                { app_status: 'Rejected'}
            ];
            console.log(statusArray);
            
            if (prepared) {
                for (let i = statusArray.length - 1; i >=0; i--) {
                    if (statusArray[i].app_status === req.query.filter) {
                        statusArray.splice(i, 1);
                    }
                }

                const apps = results[2].rows
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

                return res.render('all-applications', {
                    title: 'Applications',
                    apps: apps,
                    filter: req.query.filter,
                    noFilter: false,
                    status: statusArray
                });
            }

            const apps = results[1].rows
            console.log(apps);

            return res.render('all-applications', {
                title: 'Applications',
                apps: apps,
                noFilter: true,
                status: statusArray
            }); 
        })
        .catch((e) => {
            console.log(e);
        })
})

// Search student records

// Render search bar page
router.get('/search', (req, res) => {
    res.render('staff-search-students', {
        title: 'Find a student',
        error: false
    });
});

// Render student results
router.get('/search/results', async (req, res) => {
    
    let nameQuery = req.query.nameSearch;
    // nameQuery = '%'+nameQuery+'%';
    console.log(nameQuery);

    let schoolQuery = req.query.schoolSearch;
    // schoolQuery = '%'+schoolQuery+'%';
    console.log(schoolQuery);
    
    let placementYearQuery = req.query.placementYearSearch;
    // placementYearQuery = '%'+placementYearQuery+'%';
    console.log(placementYearQuery);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE searchStudents(text, text, text) AS '
    + 'SELECT student.user_id, student.f_name, student.l_name, student.email, student.student_id, '
    + 'student.course, student.school, student.placement_year, student.grad_year, student.pref_sector, '
    + 'other_sectors '
    + 'FROM student '
    + 'WHERE student.f_name ILIKE $1 OR student.l_name ILIKE $1 OR student.email ILIKE $1 '
    + 'OR student.school = $2 OR student.placement_year = $3 ' 
    + 'ORDER BY student.l_name ASC;'
    + `EXECUTE searchStudents('${nameQuery}', '${schoolQuery}', '${placementYearQuery}');`
    + 'DEALLOCATE searchStudents;'

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);
            if (results[2].rowCount === 0) {
                res.render('search-results', {
                    title: 'Find a student',
                    nameSearch: nameQuery,
                    schoolSearch: schoolQuery,
                    placementYearSearch: placementYearQuery,
                    result: false
                })
            } else {
                const students = results[2].rows;
                console.log(students);

                res.render('search-results', {
                    title: 'Search students',
                    students: students,
                    nameSearch: nameQuery,
                    schoolSearch: schoolQuery,
                    placementYearSearch: placementYearQuery,
                    result: true
                })                
            }
        })
        .catch((e) => {
            console.log(e);
        })
});

// Render individual student profile
router.get('/search/results/:id', async (req, res) => {
    studentUserId = req.params.id;

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE getStudentApps(bigint) AS '
    + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
    + 'application.country, application.app_date, application.deadline, application.description, application.app_status, '
    + 'application.last_updated, student.user_id, student.f_name, student.l_name '
    + 'FROM application JOIN student ON application.user_id = student.user_id '
    + 'WHERE student.user_id = $1 '
    + 'ORDER BY application.last_updated DESC;'
    + `EXECUTE getStudentApps(${studentUserId});`
    + 'DEALLOCATE getStudentApps;'

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);
            if (results[2].rowCount === 0) {
                res.render('staff-view-student', {
                    title: 'Student applications',
                    result: false
                })
            } else {
                const studentApps = results[2].rows;
                console.log(studentApps);                
                
                const studentFName = studentApps[0].f_name;
                console.log(studentFName);

                res.render('staff-view-student', {
                    title: 'Student applications',
                    result: true,
                    studentApps: studentApps,
                    studentFName: studentFName 
                })
            }
        })
        .catch((e) => {
            console.log(e);
        })
});

// Render staff insights page
router.get('/insights', async (req, res) => {

    const week = '7 days';
    const zero = '0';
    const status = 'Interested';

    let q = 'SET SEARCH_PATH TO sf;'

    // Add query to find applications with deadlines this week
    q += 'SELECT student.user_id, student.f_name, student.l_name, student.student_id, student.email, ' +
    'student.course, application.role, application.organisation, application.deadline ' +
    'FROM student ' +
    'JOIN application ' +
    'ON student.user_id = application.user_id ' +
    `WHERE deadline - NOW() <= interval '${week}' ` +
    `AND deadline - NOW() >= interval '${zero}' ` +
    `AND app_status = '${status}';` 

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);

            const deadlines = results[1].rows;
            console.log(deadlines);

            if (deadlines.length === 0) {
                return res.render('staff-insights', {
                    title: 'Student insights',
                    noDeadlines: true
                })
            }

            return res.render('staff-insights', {
                title: 'Student insights',
                deadlines: deadlines,
                noDeadlines: false
            })            
        })
        .catch((e) => {
            console.log(e);
        });
})

// Render staff manage profile page
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

// Edit staff account details
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