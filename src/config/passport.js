// Import relevant libraries and modules
const LocalStrategy = require('passport-local').Strategy
const pool = require('./db');
const bcrypt = require('bcrypt');

// Define search path variable for development environment
let searchPath = 'SET SEARCH_PATH TO sf; ';

// Define search path variable for testing environment to access test database
if (process.env.NODE_ENV === 'test') {
    searchPath = 'SET SEARCH_PATH TO sf_test; ';
}

// Function to initialize authentication
function initialize(passport) {    

    // Authentication logic with placeholder params
    const authenticateUser = (async (email, password, done) => {        

        // Select query and prepared statement
        let q = searchPath
        + 'PREPARE login(text) AS '
        + 'SELECT * FROM users WHERE email = $1; '
        + `EXECUTE login('${email}'); `
        + 'DEALLOCATE login;'        

        // Run query through database
        await pool
            .query(q)
            .then(async (results) => {
                if (results[2].rows.length > 0) {
                    const user = results[2].rows[0];
                    
                    console.log(user);

                    bcrypt.compare(password, user.password, async (err, result) => {
                        if (result) {
                            if (user.is_verified === true) {
                                return done(null, user);
                            } else {
                                return done(null, false, { message: 'Email not verified'});
                            }                                                   
                        } 
                        if (err) {                            
                            console.log(err);
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

    // Pass through input from email and password fields
    passport.use(
        new LocalStrategy(
            { usernameField: 'emaillogin', passwordField: 'passwordlogin' },
            authenticateUser
        )
    );

    // Serialize user
    passport.serializeUser((user, done) => done(null, user.user_id));

    // Deserialize user
    passport.deserializeUser(async (userId, done) => {
        let q = searchPath
        + 'PREPARE deserializeUser(bigint) AS '
        + 'SELECT * FROM users WHERE user_id = $1; '
        + `EXECUTE deserializeUser('${userId}'); `
        + 'DEALLOCATE deserializeUser;'

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

module.exports = initialize;