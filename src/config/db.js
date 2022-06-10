let { Pool } = require('pg')

let db = {
    user: 'qat16fqu',
    password: 'ExaminationDressSometimes33?',
    host: 'cmpstudb-01.cmp.uea.ac.uk',
    port: 5432,
    database: 'qat16fqu',
    idleTimeoutMillis: 30000
};

const pool = new Pool(db);

module.exports = pool;