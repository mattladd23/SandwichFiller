// Import testing tools and libraries
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/index');

// Chai middleware initialization
chai.use(chaiHttp);

// Clear database when test environment is initialized
describe('Initalize database', () => {
    describe('Delete existing table entries', (done) => {
        chai.request(app)
            .delete('/test/delete')
            .end(() => {
                done();
            })
    });

    describe('Creating a test staff user', (done) => {
        chai.request(app)
            .post('/test/create/staff')
            .end(() => {
                done();
            })
    });
});



