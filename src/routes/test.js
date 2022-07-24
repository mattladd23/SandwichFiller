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

        let userId = 1000000000001;
        const hashedPw = await bcrypt.hash('stafftest', 10);

        let qRegister = 'SET SEARCH_PATH TO sf_test; '
        + 'PREPARE registerStaff(bigint, text, text, text, text) AS '
        + 'INSERT INTO staff (user_id, f_name, l_name, email, password) '
        + 'VALUES ($1, $2, $3, $4, $5); '
        + `EXECUTE registerStaff('${userId}', 'Staff', 'Test', 'staff_test@uea.ac.uk', '${hashedPw}'); `
        + 'DEALLOCATE registerStaff;'

        await pool
            .query(qRegister)
            .then(async () => {
                
                let qVerify = 'UPDATE users '
                + 'SET '
                + 'is_verified = true, '
                + 'is_staff = true '
                + `WHERE user_id = ${userId};`;

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

    router.post('/create/admin', async () => {

        let userId = 1000000000002;
        const hashedPw = await bcrypt.hash('admintest', 10);

        let qRegister = 'SET SEARCH_PATH TO sf_test; '
        + 'PREPARE registerStaff(bigint, text, text, text, text) AS '
        + 'INSERT INTO staff (user_id, f_name, l_name, email, password) '
        + 'VALUES ($1, $2, $3, $4, $5); '
        + `EXECUTE registerStaff(${userId}, 'Admin', 'Test', 'admin_test@uea.ac.uk', '${hashedPw}'); `
        + 'DEALLOCATE registerStaff;'

        await pool
            .query(qRegister)
            .then(async () => {
                
                let qVerify = 'UPDATE users '
                + 'SET '
                + 'is_verified = true, '
                + 'is_admin = true '
                + `WHERE user_id = ${userId};`;

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

    router.post('/create/student', async () => {

        let userId = 1000000000003;
        const hashedPw = await bcrypt.hash('studenttest', 10);

        let qRegister = 'SET SEARCH_PATH TO sf_test; '
        + 'PREPARE registerStudent(bigint, text, text, text, text, bigint, text, text, text, numeric, text, text) AS '
        + 'INSERT INTO student (user_id, f_name, l_name, email, password, student_id, course, school, placement_year, grad_year, pref_sector, other_sectors) '
        + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12); '
        + `EXECUTE registerStudent(${userId}, 'Student', 'Test', 'student_test@uea.ac.uk', '${hashedPw}', 100000000, `
        + `'Course test', 'School test', '2023-2024', 2025, 'Sector test', 'Other test'); `
        + 'DEALLOCATE registerStudent;'

        await pool
            .query(qRegister)
            .then(async () => {
                
                let qVerify = 'UPDATE users '
                + 'SET '
                + 'is_verified = true '
                + `WHERE user_id = ${userId};`;

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