const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db");
const cookieSession = require("cookie-session");

// const {redirectionRegister, requiresignature, requireNoSignature, requireLoggedOut, requireSignature} = require("./middleware");
//const secrets = require("./secrets.json");

let cookie_sec;
if (process.env.cookie_secret) {
    cookie_sec = process.env.cookie_secret;
} else {
    cookie_sec = require("./secrets.json").sessionSecret;
}

const csurf = require("csurf");
const { hash, compare } = require("./bc");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(
    cookieSession({
        secret: cookie_sec,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(csurf());

app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});  

app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    next();
});

app.use(express.static("./public"));

// app.use(function (req, res, next, error) {
//     console.log("Error middleware: ", error);
// });


//////////////////
///routes////////
////////////////


app.get("/", (req, res) => {
    // let response ="Not signed!";
    // if(req.cookies.signed == "true") {
    //     response = "Yup! You have signed!";
    //     return res.redirect("/petition/signed");
    // }
    // console.log(response);
    console.log("welcome page");
    res.render("registrations", {
    // will get back to this later
        layout: "main",
    });
});


//////////////////
///login////////
////////////////


app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    hash(req.body.Password).then((hashedPw) => {
        console.log("hashed psw", hashedPw);
        db.hashedPsw(req.body.Email)
            .then((results) => {
                // update this to be email insted of just an id!!!!!!
                console.log("password sent back", results.rows[0].password);
                compare(req.body.Password, results.rows[0].password)
                    .then((match) => {
                        console.log("match value from compare:", match);

                        if (match) {
                            let userId = results.rows[0].id; // get access to the user id to set the cookie
                            req.session.userId = userId;
                            req.session.sigId = results.rows[0].sigid;
                            res.redirect("/thanks");
                        } else {
                            res.render("login");
                            // add errror message here
                        }

                        // if pw matches, we want to set a NEW cookie with the userId
                        // if not we want to send back an error msg, meaning rerender the login template but pass to it an error
                    })
                    .catch((err) => console.log("err in compare:", err));
            })
            .catch((err) => console.log("err in hash:", err));
    });
});

//////////////////
///register//////
////////////////

app.get("/register", (req,res) => {
    console.log("resistrations page");
    res.render("registrations", {
        layout: "main",
        style: "style.css"
    });
});

app.post("/register", (req, res) => { // add if statement to render register with error msg
      
    hash(req.body.password)
        .then((hashedPw) => {
            console.log("hashedPw in /register:", hashedPw);
            db.register(
                req.body.firstName,
                req.body.lastName,
                req.body.email,
                hashedPw
            )
                .then((results) => {
                    console.log(results);
                    req.session.signatureId = results.rows[0].id; // you change this, you need to alter other parts too
                    console.log(req.session.signatureId);
                    res.redirect("/profile");
                })
                .catch((err) => {
                    console.log(err);
                    // we'll be wanting to add all user information plus the hashed PW into our db
                    // if this worked successfully we want to redirect the user
                    // if sth went wrong we want to render an error msg to our user
                })
                .catch((err) => console.log("err in hash:", err));
            // you won't want to send this status in your real life application you want to redirect the user to your petition
        
            // res.render("registrations", {
            //     layout: "main",
            // });
        }); 
});


//////////////////
///profile//////
////////////////


app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});

app.post("/profile", (req, res) => {
    console.log("profiles page");
    console.log(req.session.signatureId);
    db.profiles(
        req.body.age,
        req.body.city,
        req.body.url,
        req.session.signatureId
    )
        .then((results) => {
            console.log(results);
            res.redirect("/petition");
            // res.redirec("profile", {
            //     layout: "main"
            // });
        })
        .catch((err) => {
            console.log(err);
        });
});

//////////////////
///petition//////
////////////////


app.get("/petition", (req, res) => {
    console.log(req.session.signatureId);
    res.render("welcome", {
    // will get back to this later
        layout: "main",
    });
});

app.post("/petition", (req, res) => {
    // my table is missing to get the id automatically
    console.log(req.session.signatureId);
    db.addSignature(req.body.signature, req.session.signatureId)
        .then((results) => {
            console.log("after signing", results);
            //let sigId = results.rows[0].id; // id of signer
            //console.log("signing id", sigId);
            //req.session.signatureId = sigId; // do I here set the cookie as correct id?? look further to get.petition/signed
            //console.log("cookie", req.session.signatureId);
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("does not work", err);
        });
});


//////////////////
///thanks////////
////////////////


app.get("/thanks", (req, res) => {
    console.log("get signed cookie", req.session); // shows undefined
    console.log(req.session.sigId);
    db.getSignature(req.session.signatureId) // it might be that this runs before I get back the signature
        .then((results) => {
            console.log(results);
            //console.log(results.rows[0].signature);
            //let signature = results.rows[0].signature;
            //console.log("get test of cookie", req.session.signatureId);
            //console.log(signature);
            res.render("signed", {
                layout: "main",
                //style: "style.css",
                signature: results.rows[0].signature
            });
        })
        .catch((err) => {
            console.log("does not work", err);
        });
});

app.post("/thanks", (req, res) => {
    console.log(req.body);
    console.log(req.session);
    db.deleteSignature(req.session.userId)
        .then(() => {
            req.session.signatureId = null;
        })
        .then(() => {
            console.log(req.session);
            res.redirect("/petition");
        })
        .catch((err) => console.log("error deleting sign: ", err));
});

//////////////////
///signers///////
////////////////

app.get("/signers", (req, res) => {
    // this pulls info from users table and signatures table using joins
    db.getSigners()
        .then(({rows}) => {
            console.log("results from rows", rows);
            res.render("signers", {
                layout: "main",
                rows,
                
            });
        })
        .catch((err) => {
            console.log("error getting table data", err);
        });
   
});

//////////////////
///profile edit//
////////////////


app.get("/edit", (req, res) => {
    console.log(req.session);
    db.getProfileInfo(req.session.signatureId)
        .then(({ rows }) => {
            console.log("resultProfileInfo: ", rows);
            return res.render("edit", {
                layout: "main",
                rows,
            });
        })
        .catch((err) => console.log("error in getProfileInfo", err));
});

app.post("/edit", (req, res) => {
    let { body } = req;
    if (body.password.length) {
        hash(body.password)
            .then((hashedPw) => {
                db.updateUsers(
                    body.firstName,
                    body.lastName,
                    body.email,
                    hashedPw,
                    req.session.signatureId
                );
                db.upsertUserProfiles(
                    body.age,
                    body.city,
                    body.url,
                    req.session.signatureId
                );
            })
            .catch((err) => console.log("error in hashUpdateUser", err));
        return res.redirect("/thanks");
    } else {
        db.updateUsers(
            body.firstName,
            body.lastName,
            body.email,
            body.password,
            req.session.signatureId
        );
        db.upsertUserProfiles(
            body.age,
            body.city,
            body.url,
            req.session.signatureId
        ).catch((err) => console.log("error in updateUsersNoPassword: ", err));
        return res.redirect("/thanks");
    }
});


app.listen(process.env.PORT || 8080 , ()=> console.log("petition listening"));