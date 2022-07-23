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
const { stringEscape, resultsHtmlEscape, htmlEscape } = require('../middleware/escape');
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

// Render login success page
router.get('/', checkIsAuthenticated, checkIsStaff, (req, res) => {
    res.render('staff-dashboard', {
        title: 'SandwichFiller - Staff'
    });
});

// Get all applications
router.get('/applications', checkIsAuthenticated, checkIsStaff, async (req, res) => {
    let q = 'SET SEARCH_PATH TO sf;';
    let prepared = false;

    if (Object.keys(req.query).length === 0) {
        q += 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
        + 'application.country, application.deadline, application.description, application.app_status, '
        + 'application.last_updated, student.user_id, student.f_name, student.l_name '
        + 'FROM application JOIN student ON application.user_id = student.user_id '
        + 'ORDER BY application.last_updated DESC;'
        console.log(q);

    } else {
        if (req.query.filter === 'All applications') {
            q += 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
            + 'application.country, application.deadline, application.description, application.app_status, '
            + 'application.last_updated, student.user_id, student.f_name, student.l_name '
            + 'FROM application JOIN student ON application.user_id = student.user_id '
            + 'ORDER BY application.last_updated DESC;'
            console.log(q);

        } else {
            q += 'PREPARE filter(text) AS '
            + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
            + 'application.country, application.deadline, application.description, application.app_status, '
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

                const appFeatures = ['user_id', 'app_id', 'role', 'organisation', 'city', 'country',
                                     'deadline', 'description', 'app_status', 'last_updated', 'f_name', 'l_name'];
                let sanitizedApps = resultsHtmlEscape(apps, appFeatures, ['deadline', 'last_updated']);
                sanitizedApps = sanitizeTime(sanitizedApps, 'deadline', 'last_updated');

                return res.render('all-applications', {
                    title: 'Applications',
                    apps: sanitizedApps,
                    filter: req.query.filter,
                    noFilter: false,
                    status: statusArray
                });
            }

            const apps = results[1].rows
            console.log(apps);

            const appFeatures = ['user_id', 'app_id', 'role', 'organisation', 'city', 'country',
                                 'deadline', 'description', 'app_status', 'last_updated', 'f_name', 'l_name'];
            let sanitizedApps = resultsHtmlEscape(apps, appFeatures, ['deadline', 'last_updated']);
            sanitizedApps = sanitizeTime(sanitizedApps, 'deadline', 'last_updated');

            return res.render('all-applications', {
                title: 'Applications',
                apps: sanitizedApps,
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
        title: 'Find a student'
    });
});

// Render student results
router.get('/search/results', checkIsAuthenticated, checkIsStaff, async (req, res) => {
    
    const nameQuery = req.query.nameSearch;
    const nameQueryStrEscaped = stringEscape(nameQuery);
    const nameQueryHtmlEscaped = htmlEscape(nameQuery);    
    
    console.log(nameQueryStrEscaped);

    const schoolQuery = req.query.schoolSearch;
    const schoolQueryStrEscaped = stringEscape(schoolQuery);
    const schoolQueryHtmlEscaped = htmlEscape(schoolQuery);

    console.log(schoolQueryStrEscaped);
    
    const placementYearQuery = req.query.placementYearSearch;
    const placementYearQueryStrEscaped = stringEscape(placementYearQuery);
    const placementYearQueryHtmlEscaped = htmlEscape(placementYearQuery);

    console.log(placementYearQueryStrEscaped);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE searchStudents(text, text, text) AS '
    + 'SELECT student_search.user_id, student_search.f_name, student_search.l_name, student_search.email, '
    + 'student_search.student_id, student_search.course, student_search.school, student_search.placement_year, '
    + 'student_search.grad_year, student_search.pref_sector, student_search.other_sectors '
    + 'FROM student_search '
    + 'WHERE student_search.f_name ILIKE $1 OR student_search.l_name ILIKE $1 OR student_search.email ILIKE $1 '
    + 'OR student_search.school = $2 OR student_search.placement_year = $3 ' 
    + 'ORDER BY student_search.l_name ASC;'
    + `EXECUTE searchStudents('${nameQueryStrEscaped}', '${schoolQueryStrEscaped}', '${placementYearQueryStrEscaped}');`
    + 'DEALLOCATE searchStudents;'

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);
            if (results[2].rowCount === 0) {
                res.render('search-results', {
                    title: 'Find a student',
                    nameSearch: nameQueryHtmlEscaped,
                    schoolSearch: schoolQueryHtmlEscaped,
                    placementYearSearch: placementYearQueryHtmlEscaped,
                    result: false
                })
            } else {
                const students = results[2].rows;
                console.log(students);
                const studentFeatures = ['user_id', 'f_name', 'l_name', 'email', 'student_id', 'course',
                                         'school', 'placement_year','grad_year', 'pref_sector', 'other_sectors'];
                let sanitizedStudents = resultsHtmlEscape(students, studentFeatures, ['user_id']);


                res.render('search-results', {
                    title: 'Search students',
                    students: sanitizedStudents,
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
    + 'application.country, application.deadline, application.description, application.app_status, '
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

            const studentApps = results[2].rows;
            console.log(studentApps);

            if (studentApps.length === 0) {
                res.render('staff-view-student', {
                    title: 'Student applications',                                         
                    noResult: true
                });

            } else {

                const appFeatures = ['user_id', 'app_id', 'role', 'organisation', 'city', 'country',
                                 'deadline', 'description', 'app_status', 'last_updated', 'f_name', 'l_name'];
                let sanitizedApps = resultsHtmlEscape(studentApps, appFeatures, ['deadline', 'last_updated']);
                sanitizedApps = sanitizeTime(sanitizedApps, 'deadline', 'last_updated');
                
                const studentFName = studentApps[0].f_name;
                console.log(studentFName);
                const studentFNameHtmlEscaped = htmlEscape(studentFName);

                res.render('staff-view-student', {
                    title: 'Student applications',
                    noResult: false,
                    result: true,
                    studentApps: sanitizedApps,
                    studentFName: studentFNameHtmlEscaped
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
    'SELECT student.user_id, student.f_name, student.l_name, student.student_id, student.email, ' +
    'student.course, application.app_id, application.role, application.organisation, application.city, ' +
    'application.country, application.deadline, application.description, application.app_status ' +
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
    'application.country, application.deadline, application.description, application.app_status ' +
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
    'application.country, application.deadline, application.description, application.app_status ' +
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
    'SELECT student_search.user_id, student_search.f_name, student_search.l_name, ' +
    'student_search.student_id, student_search.email, all_submitted_apps.app_id, ' +
    'all_submitted_apps.app_status ' +
    'FROM student_search ' +
    'LEFT JOIN all_submitted_apps ' +
    'ON student_search.user_id = all_submitted_apps.user_id ' +
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
    'SELECT student_search.user_id, student_search.f_name, student_search.l_name, student_search.student_id, ' +
    'student_search.email, accepted_apps.app_status ' +
    'FROM student_search ' +
    'LEFT JOIN accepted_apps ' +
    'ON student_search.user_id = accepted_apps.user_id ' +
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

    console.log('------------- \n', qEmpHighPerc);         


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
});

router.get('/insights/application/:id', checkIsAuthenticated, checkIsStaff, async (req, res) => {

    const appId = stringEscape(req.params.id);

    let q = 'SET SEARCH_PATH TO sf; '
    + 'PREPARE getApplication(bigint) AS '
    + 'SELECT application.user_id, application.app_id, application.role, application.organisation, application.city, '
    + 'application.country, application.deadline, application.description, application.app_status, '
    + 'application.last_updated, student.user_id, student.f_name, student.l_name '
    + 'FROM application JOIN student ON application.user_id = student.user_id '
    + 'WHERE application.app_id = $1; '
    + `EXECUTE getApplication(${appId}); `
    + 'DEALLOCATE getApplication;'

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            const app = results[2].rows;

            const appFeatures = ['user_id', 'app_id', 'role', 'organisation', 'city', 'country',
                                     'deadline', 'description', 'app_status', 'last_updated', 'f_name', 'l_name'];
            let sanitizedApp = resultsHtmlEscape(app, appFeatures, ['deadline', 'last_updated']);
            sanitizedApp = sanitizeTime(sanitizedApp, 'deadline', 'last_updated');

            res.render('staff-view-application', {
                title: 'Application information',
                app: sanitizedApp,
                result: true
            });
        })
});

// Render staff manage profile page
router.get('/account', checkIsAuthenticated, checkIsStaff, async (req, res) => {

    const userId = stringEscape(req.session.passport.user);

    let q = 'SET SEARCH_PATH TO sf;'
    + 'PREPARE getStaffAccount(bigint) AS '
    + 'SELECT staff.user_id, staff.f_name, staff.l_name, staff.email '
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

            const accDetailsFeatures = ['user_id', 'f_name', 'l_name', 'email'];
            const sanitizedAccDetails = resultsHtmlEscape(accDetails, accDetailsFeatures, ['user_id']);

            res.render('staff-manage', {
                title: 'Manage my account',                
                error: req.query.error,
                success: req.query.success,
                accDetails: sanitizedAccDetails
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
    body('staffemail', 'Email is not a valid address!').isEmail(),
    // body('staffemail', 'Email is not a valid UEA address!').isEmail().contains('@uea.ac.uk'),  

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
    + 'PREPARE editStaffAccount(text, text, bigint) AS '
    + 'UPDATE staff '
    + 'SET f_name = $1, l_name = $2 '
    + 'WHERE user_id = $3;'
    + `EXECUTE editStaffAccount('${staffFName}', '${staffLName}', ${userId}); `
    + 'DEALLOCATE editStaffAccount';

    await pool
        .query(q)
        .then(() => {
            // res.redirect('/staff?success=true');
            res.render('staff-manage', {
                title: 'Manage account',
                success: true,
                successMsg: 'Account updated successfully!'
            })
        })
    .catch((e) => {
        console.log(e);
    })
});

// To render staff change password page
router.get('/account/password', checkIsAuthenticated, checkIsStaff, (req, res) => {
    res.render('staff-changepw', {
        title: 'Staff - Change password',
        success: req.query.success,
        error: req.query.error
    });
});

// To change staff password
router.put('/account/password', checkIsAuthenticated, checkIsStaff,
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
        return res.render('staff-changepw', {
            title: 'Staff - Change password',
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
                        return res.render('staff-changepw', {
                            title: 'Staff - Change password',
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
                            // res.redirect('/staff/account?success=true');
                            res.render('staff-changepw', {
                                title: 'Staff - Change password',
                                success: true,
                                successMsg: 'Password changed successfully!'
                            })                     
                        })
                        .catch((e) => {
                            console.log(e);
                        })
                } else {
                    res.render('staff-changepw', {
                        title: 'Staff - Change password',
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