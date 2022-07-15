
function checkIsAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login?unauthenticated=true');
    }
}

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
