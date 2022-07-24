// Import testing tools and libraries
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/index');

// Chai middleware initialization
chai.use(chaiHttp);

// Chai expect object destructuring
const { expect } = chai;

// All registering and logging in tests
describe('Authentication tests', () => {

    describe('POST /register/staff', () => {
        it('Should register a staff user', (done) => {
            const user = {
                stafffname: 'Staff',
                stafflname: 'Testcase',
                staffemail: 'staff_test_case@uea.ac.uk',
                staffpassword: 'stafftest',
                staffconfirmpw: 'stafftest'
            };
            chai.request(app)
                .post('/register/staff')
                .send(user)
                .end((err, response) => {
                    expect(response.text).to.have.string('Almost there! Please find the account verification email from us to complete your account setup...')
                    expect(response.status).to.equal(200)
                    done();
                });
        });
    });

    describe('POST /register/student', () => {
        it('Should register a student user', (done) => {
            const user = {
                studentfname: 'Student',
                studentlname: 'Testcase',
                studentemail: 'student_test_case@uea.ac.uk',
                studentid: '100111222',
                course: 'Course test case',
                school: 'School test case',
                placementyear: '2023-2024',
                gradyear: '2025',
                prefsector: 'Sector test case',
                othersectors: 'Other test case',
                studentpassword: 'studenttest',
                confirmstudentpw: 'studenttest'
            };            
            chai.request(app)
                .post('/register/student')
                .send(user)
                .end((err, response) => {
                    expect(response.text).to.have.string('Almost there! Please find the account verification email from us to complete your account setup...')
                    expect(response.status).to.equal(200)
                    done();
                });
        });
    });

    describe('POST /register/staff', () => {
        it('Should try to register an existing staff user', (done) => {
            const user = {
                stafffname: 'Staff',
                stafflname: 'Testcase',
                staffemail: 'staff_test_case@uea.ac.uk',
                staffpassword: 'stafftest',
                staffconfirmpw: 'stafftest'
            };
            chai.request(app)
                .post('/register/staff')
                .send(user)
                .end((err, response) => {
                    expect(response.text).to.have.string('One more more of your credentials are invalid. Please try again.')
                    expect(response.status).to.equal(200)
                    done();
                });
        });
    });

    describe('POST /register/student', () => {
        it('Should try to register an existing student user', (done) => {
            const user = {
                studentfname: 'Student',
                studentlname: 'Testcase',
                studentemail: 'student_test_case@uea.ac.uk',
                studentid: '100111222',
                course: 'Course test case',
                school: 'School test case',
                placementyear: '2023-2024',
                gradyear: '2025',
                prefsector: 'Sector test case',
                othersectors: 'Other test case',
                studentpassword: 'studenttest',
                confirmstudentpw: 'studenttest'
            };
            chai.request(app)
                .post('/register/student')
                .send(user)
                .end((err, response) => {
                    expect(response.text).to.have.string('One more more of your credentials are invalid. Please try again.')
                    expect(response.status).to.equal(200)
                    done();
                });
        });
    });

    describe('POST /register/student', () => {
        it('Should try to register a user not using a valid UEA email address', (done) => {
            const user = {
                studentfname: 'Student',
                studentlname: 'Testcase',
                studentemail: 'student_test_case@gmail.com',
                studentid: '100111222',
                course: 'Course test case',
                school: 'School test case',
                placementyear: '2023-2024',
                gradyear: '2025',
                prefsector: 'Sector test case',
                othersectors: 'Other test case',
                studentpassword: 'studenttest',
                confirmstudentpw: 'studenttest'
            };
            chai.request(app)
                .post('/register/student')
                .send(user)
                .end((err, response) => {
                    console.log(response.text)
                    expect(response.text).to.have.string('Email is not a valid UEA email address')
                    expect(response.status).to.equal(200)
                    done();
                });
        });
    });

    // describe('POST /login', () => {
    //     it('Should log in with correct staff credentials', (done) => {
    //         const user = {
    //             emaillogin: 'staff_test@uea.ac.uk',
    //             passwordlogin: 'stafftest'
    //         };
    //         chai.request(app)
    //             .post('/login')
    //             .send(user)
    //             .end((err, response) => {
    //                 expect(response.text).to.have.string('Staff dashboard')
    //                 expect(response.status).to.equal(200)
    //                 done();
    //             });
    //     });
    // });

    describe('POST /login', () => {
        it('Should try to log in with incorrect email', (done) => {
            const user = {
                emaillogin: 'stafftest@uea.ac.uk',
                passwordlogin: 'stafftest'
            };
            chai.request(app)
                .post('/login')
                .send(user)
                .end((err, response) => {
                    console.log(response.text)
                    expect(response.text).to.have.string('Incorrect email or password!')
                    expect(response.status).to.equal(200)
                    done();
                });
        });
    });

    describe('POST /login', () => {
        it('Should try to log in with incorrect password', (done) => {
            const user = {
                emaillogin: 'staff_test@uea.ac.uk',
                passwordlogin: 'staff'
            };
            chai.request(app)
                .post('/login')
                .send(user)
                .end((err, response) => {
                    expect(response.text).to.have.string('Incorrect email or password!')
                    expect(response.status).to.equal(200)
                    done();
                });
        });
    });
});