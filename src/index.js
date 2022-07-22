// Import relevant libraries and modules
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const session = require('express-session');
const passport = require('passport');
const initializePassport = require('./config/passport');
const { checkNotAuthenticated } = require('./middleware/checkAuth');

// Define routes
const registerRoute = require('./routes/register');
const loginRoute = require('./routes/login');
const userRoute = require('./routes/user');
const studentRoute = require('./routes/student');
const staffRoute = require('./routes/staff');
const testRoute = require('./routes/test');
const adminRoute = require('./routes/admin');
const forgotRoute = require('./routes/forgot');

// Instantiate server
const app = express();
const port = process.env.PORT || 3000;


// Define paths for handlebars engine to read
const publicPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');

// Set up a static directory for public directory
app.use(express.static(publicPath));

// Initialize handlebars engine and locate paths
app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);

// Set up session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    rolling: true,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// So express can read information from forms
app.use(express.urlencoded({ extended: false }));

// To read information in .json format
app.use(express.json());

// Passport
initializePassport(passport);

app.use(passport.initialize());
app.use(passport.session());


// Call routes
app.use('/register', registerRoute);
app.use('/login', loginRoute);
app.use('/user', userRoute);
app.use('/student', studentRoute);
app.use('/staff', staffRoute);
app.use('/test', testRoute);
app.use('/admin', adminRoute);
app.use('/forgot', forgotRoute);


// Root url
app.get('/', checkNotAuthenticated, (req, res) => {
    res.redirect('/home');
});

// Render homepage
app.get('/home', checkNotAuthenticated, (req, res) => {
    res.render('home', {
        title: 'Welcome to SandwichFiller!'
    });
});


// Initialize server 
app.listen(port, () => {
    console.log(`Listening on port ${port} (${process.env.NODE_ENV})`);
});