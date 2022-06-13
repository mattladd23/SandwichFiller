// Import relevant libraries and modules
const LocalStrategy = require('passport-local').Strategy
const pool = require('./db');
const bcrypt = require('bcrypt');

// Function to initialize staff authentication
function initializeStaff(passport) {

    // Authentication logic with placeholder params
    const authenticateStaff = (async (email, password, done) => {

        // Select query and prepared statement
        let q = 'SET SEARCH_PATH TO sf;'
        + 'PREPARE loginStaff(text) AS '
        + 'SELECT * FROM staff WHERE email = $1;'
        + `EXECUTE loginStaff('${email}');`
        +  'DEALLOCATE loginStaff;'

        // Run query through database - is results index 2 or 3?
        await pool
            .query(q)
            .then(async (results) => {
                if (results[2].rows.length > 0) {
                    const staff = results[2].rows[0];

                    bcrypt.compare(password, staff.password, async (err, result) => {
                        if (result) {
                            return done(null, staff);
                        } 
                        if (err) {
                            console.log(e);
                        } else {
                            return done(null, false, { message: 'Email or password incorrect'});
                        }
                    })
                } else {
                    return done(null, false, { message: 'Email or password incorrect'});
                }
            })
            .catch(async (e) => {
                console.log(e);
            })
    });

    // Pass through input from the staffemail and staffpassword
    passport.use(
        new LocalStrategy(
            { usernameField: 'staffemaillogin', passwordField: 'staffpwlogin' },
            authenticateStaff
        )
    );

    // Serialize user
    passport.serializeUser((staff, done) => done(null, staff.user_id));

    // Deserialize user
    passport.deserializeUser(async (staffUserId, done) => {
        let q = 'SET SEARCH_PATH TO sf;'
        + 'PREPARE deserializeStaff(bigint) AS '
        + 'SELECT * FROM staff WHERE user_id = $1;'
        + `EXECUTE deserializeStaff('${staffUserId}');`
        + 'DEALLOCATE deserializeStaff;'

        await pool
            .query(q)
            .then(async (results) => {
                return done(null, results[2].rows[0]);
            })
            .catch(async (e) => {
                console.log(e);
                return done(e);
            });
    });
};

module.exports = initializeStaff;