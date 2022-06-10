// Import relevant libraries and packages
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const session = require('session');
const csrf = require('csurf');
const passport = require('passport');

// Define routes
const registerRoute = require('./routes/register');
const loginRoute = require('./routes/login');
const studentRoute = require('./routes/student');
const staffRoute = require('./routes/staff');
const testRoute = require('./routes/test');

// Instantiate server
const app = express();
const port = process.env.PORT || 3000;


// Define paths for handlebars engine to read
const publicPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../template/partials');

// Initialize handlebars engine and locate paths
app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);

// Set up a static directory for public directory
app.use(express.static(publicPath));

// So express can read information from forms
app.use(express.urlencoded({ extended: false }));

// To read information in .json format
app.use(express.json());

// Passport


// Call routes
app.use('/register', registerRoute);
app.use('/login', loginRoute);
app.use('/student', studentRoute);
app.use('/staff', staffRoute);
app.use('/test', testRoute);


// Root url
app.get('/', (req, res) => {
    res.redirect('/home');
})

// Render homepage
app.get('/home', (req, res) => {
    res.render('home', {
        title: 'Welcome to SandwichFiller'
    });
})


// Initialize server 
app.listen(port, () => {
    console.log(`Listening on port ${port} (${process.env.NODE_ENV})`);
})