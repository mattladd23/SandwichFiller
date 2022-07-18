// Instantiate express and router
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Import database model
const pool = require('../config/db');

// Import other libraries and modules
const methodOverride = require('method-override');
const { checkIsAuthenticated } = require('../middleware/checkAuth');
const { checkIsStaff } = require('../middleware/checkPermission');
const { body, validationResult } = require('express-validator');
const { stringEscape, resultsHtmlEscape } = require('../middleware/escape');

// Middleware
router.use(methodOverride('_method'));

// Render login success page
router.get('/', checkIsAuthenticated, checkIsStaff, (req, res) => {
    res.render('staff-dashboard', {
        title: 'SandwichFiller - Staff',
        error: false
    });
});

// Get all applications
router.get('/applications', checkIsAuthenticated, checkIsStaff, async (req, res) => {
    let q = 'SET SEARCH_PATH TO sf;';
    let prepared = false;

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
router.get('/search', checkIsAuthenticated, checkIsStaff, (req, res) => {
    res.render('staff-search-students', {
        title: 'Find a student',
        error: false
    });
});

// Render student results
router.get('/search/results', checkIsAuthenticated, checkIsStaff, async (req, res) => {
    
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
router.get('/search/results/:id', checkIsAuthenticated, checkIsStaff, async (req, res) => {
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
router.get('/insights', checkIsAuthenticated, checkIsStaff, async (req, res) => {

    let searchPath = 'SET SEARCH_PATH TO sf; '

    // Define parameters and queries of all insights prior to executing promises in parallel

    // Parameters to be used across all queries
    const week = '7 days';
    const zero = '0';
    const interested = 'Interested';
    const applied = 'Applied';
    const onlineTests = 'Online tests';
    const assessmentCentre = 'Assessment centre';
    const interview = 'Interview';
    const accepted = 'Accepted';
    const rejected = 'Rejected';
    

    // Query to find applications with deadlines this week
    let qDeadlines = searchPath +
    'SELECT student.user_id, student.f_name, student.l_name, student.student_id, ' +
    'student.email, student.course, application.role, application.organisation, application.deadline ' +
    'FROM student ' +
    'JOIN application ' +
    'ON student.user_id = application.user_id ' +
    `WHERE deadline - NOW() <= interval '${week}' ` +
    `AND deadline - NOW() >= interval '${zero}' ` +
    `AND app_status = '${interested}';` 

    console.log('------------- \n', qDeadlines);


    // Query to find accepted applications active this week
    let qAppsAcc = searchPath +
    'SELECT student.user_id, student.f_name, student.l_name, student.student_id, student.email, ' +
    'application.app_id, application.role, application.organisation, application.city, ' +
    'application.country, application.app_date, application.deadline, application.description, ' +
    'application.app_status, application.last_updated ' +
    'FROM student ' +
    'JOIN application ' +
    'ON student.user_id = application.user_id ' +
    `WHERE application.last_updated >= NOW() - interval '${week}' ` +
    `AND application.app_status = '${accepted}';`

    console.log('------------- \n', qAppsAcc);   


    // Query to find rejected applications active this week
    let qAppsRej = searchPath +
    'SELECT student.user_id, student.f_name, student.l_name, student.student_id, student.email, ' +
    'application.app_id, application.role, application.organisation, application.city, ' +
    'application.country, application.app_date, application.deadline, application.description, ' +
    'application.app_status, application.last_updated ' +
    'FROM student ' +
    'JOIN application ' +
    'ON student.user_id = application.user_id ' +
    `WHERE application.last_updated >= NOW() - interval '${week}' ` +
    `AND application.app_status = '${rejected}';`
    

    console.log('------------- \n', qAppsRej);


    // Query to find students with most applications submitted
    let qMostApps = searchPath +
    'SELECT * FROM apps_submitted_ordered ' +
    'WHERE apps_submitted_ordered.num_apps >= (' +
    'SELECT percentile_disc(0.75) WITHIN GROUP ' +
    '(ORDER BY apps_submitted_ordered.num_apps) ' +
    'FROM apps_submitted_ordered' +
    ');'

    console.log('------------- \n', qMostApps);

    // Query to find students who are yet to have submitted any applications
    let qNoApps = searchPath +
    'SELECT student.user_id, student.f_name, student.l_name, ' +
    'student.student_id, student.email, all_submitted_apps.app_id, ' +
    'all_submitted_apps.app_status ' +
    'FROM student ' +
    'LEFT JOIN all_submitted_apps ' +
    'ON student.user_id = all_submitted_apps.user_id ' +
    'WHERE all_submitted_apps.app_status IS null;'

    console.log('------------- \n', qNoApps);


    // Query to find students with the most placement offers received
    let qMostOffers = searchPath +
    'SELECT student.user_id, student.f_name, student.l_name, ' +
    'student.student_id, student.email, COUNT(application.app_status) as apps_accepted ' +
    'FROM student ' +
    'JOIN application ' +
    'ON student.user_id = application.user_id ' +
    `WHERE application.app_status = '${accepted}' ` +
    'GROUP BY student.user_id ' +
    'ORDER BY apps_accepted DESC;'

    console.log('------------- \n', qMostOffers);

    // Query to find student who are yet to have received any placement offers
    let qNoOffers = searchPath +
    'SELECT student.user_id, student.f_name, student.l_name, student.student_id, ' +
    'student.email, accepted_apps.app_status ' +
    'FROM student ' +
    'LEFT JOIN accepted_apps ' +
    'ON student.user_id = accepted_apps.user_id ' +
    'WHERE accepted_apps.app_status IS null;'

    console.log('------------- \n', qNoOffers);


    // Query to find employers with most applications
    let qEmpMostApps = searchPath +
    'SELECT application.organisation, COUNT(application.organisation) AS num_apps ' +
    'FROM application ' +
    `WHERE application.app_status = '${applied}' ` +
    `OR application.app_status = '${onlineTests}' ` +
    `OR application.app_status = '${assessmentCentre}' ` +
    `OR application.app_status = '${interview}' ` +
    `OR application.app_status = '${accepted}' ` +
    `OR application.app_status = '${rejected}' ` +
    'GROUP BY application.organisation ' +
    'ORDER BY num_apps;'

    console.log('------------- \n', qEmpMostApps);

    // Query to find employers with most placement offers
    let qEmpMostOffers = searchPath +
    'SELECT * from acc_apps_per_emp;'

    console.log('------------- \n', qEmpMostOffers);

    // Query to find employers with highest percentage of offers to applications
    let qEmpHighPerc = searchPath +
    'SELECT acc_apps_per_emp.organisation, acc_apps_per_emp.accepted_apps, ' +
    'total_apps_per_emp.total_apps, (accepted_apps/total_apps*100) as perc_offers ' +
    'FROM acc_apps_per_emp ' +
    'JOIN total_apps_per_emp ' +
    'ON acc_apps_per_emp.organisation = total_apps_per_emp.organisation ' +
    'ORDER BY perc_offers;'

    console.log('------------- \n', qEmpHighPerc)         


    await Promise.all([
            pool.query(qDeadlines),
            pool.query(qAppsAcc),
            pool.query(qAppsRej),
            pool.query(qMostApps),
            pool.query(qNoApps),
            pool.query(qMostOffers),
            pool.query(qNoOffers),
            pool.query(qEmpMostApps),
            pool.query(qEmpMostOffers),
            pool.query(qEmpHighPerc)
        ])
            .then(([
                qDeadlinesRes, 
                qAppsAccRes, 
                qAppsRejRes, 
                qMostAppsRes, 
                qNoAppsRes,
                qMostOffersRes,
                qNoOffersRes,
                qEmpMostAppsRes,
                qEmpMostOffersRes,
                qEmpHighPercRes
            ]) => {
                console.log(
                'Deadlines results: \n', qDeadlinesRes, '\n',
                'Applications accepted active this week results: \n', qAppsAccRes, '\n',
                'Applications rejected active this week results: \n', qAppsRejRes, '\n',
                'Students with most applications submitted results: \n', qMostAppsRes, '\n',
                'Students with no applications submitted results: \n', qNoAppsRes, '\n',
                'Students with most offers results: \n', qMostOffersRes, '\n',
                'Students with no offers results: \n', qNoOffersRes, '\n',
                'Employers with most applications results: \n', qEmpMostAppsRes, '\n',
                'Employers with most offers results: \n', qEmpMostOffersRes, '\n',
                'Employers with highest percentage of offers to applications results \n', qEmpHighPercRes, '\n'
                );
                
                // Assign results objects to variables to be produced in hbs

                const deadlines = qDeadlinesRes[1].rows;
                console.log(deadlines);

                const appsAcc = qAppsAccRes[1].rows;
                console.log(appsAcc);

                const appsRej = qAppsRejRes[1].rows;
                console.log(appsRej);

                const mostApps = qMostAppsRes[1].rows;
                console.log(mostApps);

                const noApps = qNoAppsRes[1].rows;
                console.log(noApps);

                const mostOffers = qMostOffersRes[1].rows;
                console.log(mostOffers);

                const noOffers = qNoOffersRes[1].rows;
                console.log(noOffers);

                const empMostApps = qEmpMostAppsRes[1].rows;
                console.log(empMostApps);

                const empMostOffers = qEmpMostOffersRes[1].rows;
                console.log(empMostOffers);

                const empHighPerc = qEmpHighPercRes[1].rows;
                console.log(empHighPerc);
                
                console.log(deadlines.length);
                console.log(appsAcc.length);
                console.log(appsRej.length);

                // Condition if one weekly metric is empty
                
                if (deadlines.length === 0  && appsAcc.length === 0 && appsRej.length === 0) {
                    return res.render('staff-insights', {
                        title: 'Student insights',
                        noDeadlines: true,
                        noAppsAcc: true,
                        noAppsRej: true,
                        mostApps: mostApps,
                        noApps: noApps,
                        mostOffers: mostOffers,
                        noOffers: noOffers,
                        empMostApps: empMostApps,
                        empMostOffers: empMostOffers,
                        empHighPerc: empHighPerc                        
                    });
                } else if (deadlines.length === 0 && appsAcc.length === 0) {
                    return res.render('staff-insights', {
                        title: 'Student insights',
                        noDeadlines: true,
                        noAppsAcc: true,
                        noAppsRej: false,
                        appsRej: appsRej,
                        mostApps: mostApps,
                        noApps: noApps,
                        mostOffers: mostOffers,
                        noOffers: noOffers,
                        empMostApps: empMostApps,
                        empMostOffers: empMostOffers,
                        empHighPerc: empHighPerc
                    });
                } else if (deadlines.length === 0 && appsRej.length === 0) {
                    return res.render('staff-insights', {
                        title: 'Student insights',
                        noDeadlines: true,
                        noAppsAcc: false,
                        appsAcc: appsAcc,
                        noAppsRej: true,
                        mostApps: mostApps,
                        noApps: noApps,
                        mostOffers: mostOffers,
                        noOffers: noOffers,
                        empMostApps: empMostApps,
                        empMostOffers: empMostOffers,
                        empHighPerc: empHighPerc 
                    });
                } else if (appsAcc.length === 0 && appsRej.length === 0) {
                    return res.render('staff-insights', {
                        title: 'Student insights',
                        noDeadlines: false,
                        deadlines: deadlines,
                        noAppsAcc: true,
                        noAppsRej: true,
                        mostApps: mostApps,
                        noApps: noApps,
                        mostOffers: mostOffers,
                        noOffers: noOffers,
                        empMostApps: empMostApps,
                        empMostOffers: empMostOffers,
                        empHighPerc: empHighPerc
                    });
                } else if (deadlines.length === 0) {
                    return res.render('staff-insights', {
                        title: 'Student insights',
                        noDeadlines: true,
                        noAppsAcc: false,
                        appsAcc: appsAcc,
                        noAppsRej: false,
                        appsRej: appsRej,
                        mostApps: mostApps,
                        noApps: noApps,
                        mostOffers: mostOffers,
                        noOffers: noOffers,
                        empMostApps: empMostApps,
                        empMostOffers: empMostOffers,
                        empHighPerc: empHighPerc
                    });
                } else if (appsAcc.length === 0) {
                    return res.render('staff-insights', {
                        title: 'Student insights',
                        noDeadlines: false,
                        deadlines: deadlines,
                        noAppsAcc: true,
                        noAppsRej: false,
                        appsRej: appsRej,
                        mostApps: mostApps,
                        noApps: noApps,
                        mostOffers: mostOffers,
                        noOffers: noOffers,
                        empMostApps: empMostApps,
                        empMostOffers: empMostOffers,
                        empHighPerc: empHighPerc
                    });
                } else if (appsRej.length === 0) {
                    return res.render('staff-insights', {
                        title: 'Student insights',
                        noDeadlines: false,
                        deadlines: deadlines,
                        noAppsAcc: false,
                        appsAcc: appsAcc,
                        noAppsRej: true,
                        mostApps: mostApps,
                        noApps: noApps,
                        mostOffers: mostOffers,
                        noOffers: noOffers,
                        empMostApps: empMostApps,
                        empMostOffers: empMostOffers,
                        empHighPerc: empHighPerc
                    });
                }

                return res.render('staff-insights', {
                    title: 'Student insights',
                    noDeadlines: false,
                    deadlines: deadlines,
                    noAppsAcc: false,
                    appsAcc: appsAcc,
                    noAppsRej: false,
                    appsRej: appsRej,
                    mostApps: mostApps,
                    noApps: noApps,
                    mostOffers: mostOffers,
                    noOffers: noOffers,
                    empMostApps: empMostApps,
                    empMostOffers: empMostOffers,
                    empHighPerc: empHighPerc
                });       
            })
            .catch((e) => {
                console.log(e);
            });
})

// Render staff manage profile page
router.get('/account', checkIsAuthenticated, checkIsStaff, async (req, res) => {

    const userId = stringEscape(req.session.passport.user);

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
router.put('/account', checkIsAuthenticated, checkIsStaff,
    body('stafffname', 'Invalid first name. Check for spaces before or after your name!').isAlpha('en-GB', {ignore: '-'}),
    body('stafffname', 'Invalid first name. Please keep your first name to 20 characters or less!').isLength({ max: 20 }),
    body('stafflname', 'Invalid last name. Check for spaces before or after your name!').isAlpha('en-GB', {ignore: '-'}),
    body('stafflname', 'Invalid last name. Please keep your last name to 20 characters or less!').isLength({ max: 20}),
    body('staffemail', 'Email is not a valid UEA address!').isEmail().contains('@uea.ac.uk'),  

    async (req, res) => {

    // Error handlers
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('staff-manage', {
            title: 'Manage account',
            error: true,            
            errorMsg: errors.errors[0].msg
        })
    }
    
    const staffFName = stringEscape(req.body.stafffname);
    const staffLName = stringEscape(req.body.stafflname);
    const staffEmail = stringEscape(req.body.staffemail);
    const userId = stringEscape(req.session.passport.user);

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
            res.redirect('/staff?success=true');
        })
    .catch((e) => {
        console.log(e);
    })
});


// Staff log out
router.delete('/logout', checkIsAuthenticated, checkIsStaff, (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        res.status(301);
        res.redirect('/home');
    });    
});

module.exports = router;