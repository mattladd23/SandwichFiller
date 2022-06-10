// Instantiate express and router
const express = require('express');
const router = express.Router();

// Relevant libraries
const methodOverride = require('method-override');

// Middleware
router.use(methodOverride('_method'));


module.exports = router;