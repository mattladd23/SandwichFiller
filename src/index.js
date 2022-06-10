// Import relevant libraries and packages
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const session = require('session');
const csrf = require('csurf');
const passport = require('passport');


// Import modules from other files and directories


// Create server
const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening on port ${port} (${process.env.NODE_ENV})`);
})