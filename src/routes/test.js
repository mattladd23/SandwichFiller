// Instantiate express and router
const express = require('express');
const router = express.Router();

// Import database model
const pool = require('../config/db');

// Import relevant libraries
const bcrypt = require('bcrypt');

if (process.env.NODE_ENV === 'test') {
    router.delete('/delete', async () => {
        let q = 'SET SEARCH_PATH TO sf_test; '
        + 'DELETE FROM application; '
        + 'DELETE FROM users; '
        + 'DELETE FROM student; '
        + 'DELETE FROM staff; ';

        await pool
            .query(q)
            .then()
            .catch((e) => {
                console.log(e);
            })
    });

    router.post('/create/staff', async () => {

        let userId = Date.now().toString();
        const hashedPw = await bcrypt.hash('password', 10);

        let qRegister = 'SET SEARCH_PATH TO sf_test; '
        + 'PREPARE registerStaff(bigint, text, text, text, text) AS '
        + 'INSERT INTO staff (user_id, f_name, l_name, email, password) '
        + 'VALUES ($1, $2, $3, $4, $5);'
        + `EXECUTE registerStaff(${staffUserId}, '${staffFName}', '${staffLName}', '${staffEmail}', '${staffPassword}');`
        + 'DEALLOCATE registerStaff;'

        await pool
            .query(qRegister)
            .then(async () => {
                
                let qVerify = 'UPDATE users '
                + 'SET '
                + 'is_verified = true, '
                + 'is_staff = true ';

                await pool
                    .query(qVerify)
                    .then()
                    .catch((e) => {
                        console.log(e);
                    })
            })
            .catch((e) => {
                console.log(e);
            })
    });
}


module.exports = router;