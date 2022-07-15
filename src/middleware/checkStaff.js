const pool = require("../config/db")

const checkIsStaff = (async(req, res, next) => {

    let userId = req.session.passport.user

    let q = 'SET SEARCH_PATH TO sf; ' +
    'PREPARE checkIsStaff(bigint) AS ' +
    'SELECT users.is_staff ' +
    'FROM users ' +
    'WHERE users.user_id = $1; ' +
    `EXECUTE checkIsStaff(${userId}); ` +
    'DEALLOCATE checkIsStaff;';

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);          

            const isStaff = results[2].rows[0];
            console.log(isStaff);
            console.log(isStaff.is_staff);

            if (isStaff.is_staff) {
                return next();
            } else {
                return res.redirect('/student');
            }

        })
        .catch((e) => {
            console.log(e);
        })
})

const checkIsStudent = (async (req, res, next) => {

    let userId = req.session.passport.user;

    let q = 'SET SEARCH_PATH TO sf; ' +
    'PREPARE checkIsStudent(bigint) AS ' +
    'SELECT users.is_staff ' +
    'FROM users ' +
    'WHERE users.user_id = $1; ' +
    `EXECUTE checkIsStudent(${userId}); ` +
    'DEALLOCATE checkIsStudent;';

    console.log(q);

    await pool
        .query(q)
        .then((results) => {
            console.log(results);
            const isStaff = results[2].rows[0];
            console.log(isStaff);

            console.log(isStaff.is_staff);

            if (!isStaff.is_staff) {
                return next();                
            } else {
                return res.redirect('/staff');
            }
        })
        .catch((e) => {
            console.log(e);
        })
})

module.exports = {
    checkIsStaff: checkIsStaff,
    checkIsStudent: checkIsStudent
}