
// Prevent access for those not authenticated
function checkIsAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login?unauthenticated=true');
    }
}

// Divert navigation for those already authenticated
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/staff');
    }
    next();
}

module.exports = {
    checkIsAuthenticated: checkIsAuthenticated,
    checkNotAuthenticated: checkNotAuthenticated
};
