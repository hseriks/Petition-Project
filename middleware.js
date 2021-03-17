exports.redirectionRegister = (req, res, next) => {
    if (!req.session.userId && req.url != '/register' && req.url != '/login') {
        res.redirect('/register');
    } else {
        next();
    }
};

exports.requireLoggedOut = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect("/petition");
    }
    next();
};

exports.requireNoSignature = (req, res, next) => {
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        next();
    }
};

exports.requireSignature = (req, res, next) => {
    if (!req.session.signatureId) {
        return res.redirect("/petition"); // return so the code block after does not run
    }
    next();
};