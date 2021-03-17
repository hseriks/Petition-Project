// this module holds all the queries we use to talk to the databases

const spicedPg = require("spiced-pg");

const db = spicedPg(process.env.DATABASE_URL || "postgres:postgres:postgres@localhost:5432/petitions"); //when we log in, we need to authenticate ourself when working on WSL. First we speak to postgres, then add user, then add password

module.exports.getSigners = function () {
    return db.query("SELECT users.first, users.last, user_profiles.city, user_profiles.url, user_profiles.age FROM signatures JOIN users ON users.id = signatures.user_id LEFT JOIN user_profiles ON users.id = user_profiles.user_id;");
};


module.exports.addSignature = (signature, user_id)=>{
    const q =
      "INSERT INTO signatures (signature, user_id) VALUES ($1,$2) RETURNING id;";
    return db.query(q, [signature, user_id]);
};


module.exports.getSignature = (user_id) => {
    const q = "SELECT signature FROM signatures WHERE user_id = ($1);";
    return db.query(q, [user_id]);
};

module.exports.register = (first,last,email,password) => {
    const q = "INSERT INTO users (first, last, email, password) VALUES ($1,$2,$3,$4) RETURNING id";
    return db.query(q, [first,last,email,password]);
};

module.exports.login = (password) => {
    const q ="SELECT password FROM users WHERE id = ($1)";
    return db.query(q, [password]);
};

module.exports.profiles = (age, city, homepage, user) => {
    const q ="INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1,$2,$3,$4) RETURNING id";
    return db.query(q, [age || null, city || null, homepage || null, user]);
};

module.exports.hashedPsw2 = (email) => {
    const q = "SELECT password FROM users WHERE email = $1;";
    return db.query(q, [email]);
};

module.exports.hashedPsw = (email) => {
    const q = "SELECT password, users.id, signatures.id as sigid FROM users left join signatures ON users.id = user_id WHERE email = $1;";
    return db.query(q, [email]);
};

module.exports.getProfileInfo = (user_id) => {
    const q = `SELECT users.first, users.last, users.email, users.password, user_profiles.age, user_profiles.city, user_profiles.url FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id WHERE users.id = $1`;
    const params = [user_id];
    return db.query(q, params);
};

module.exports.updateUsers = (first, last, email, password, id) => {
    if (password.length) {
        const q = `UPDATE users SET first = $1, last = $2, email = $3, password = $4 WHERE id = $5`;
        const params = [first, last, email, password, id];
        return db.query(q, params);
    } else {
        const q = `UPDATE users SET first = $1, last = $2, email = $3 WHERE id = $4`;
        const params = [first, last, email, id];
        return db.query(q, params);
    }
};

module.exports.upsertUserProfiles = (age, city, url, user_id) => {
    const params = [age, city, url, user_id];
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET age = $1, city = $2, url = $3, user_id = $4`,
        params
    );
};

module.exports.deleteSignature = (user_id) => {
    const user = [user_id];
    return db.query(`DELETE FROM signatures WHERE user_id = $1`, user);
};

module.exports.getSignersByCity = (city) => {
    const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url, signatures.signature FROM users
    JOIN user_profiles
    ON users.id = user_profiles.user_id
    JOIN signatures
    ON users.id = signatures.user_id
    WHERE LOWER(user_profiles.city) = LOWER($1)`;
    return db.query(q, [city]); 
};


