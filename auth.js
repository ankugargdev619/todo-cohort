const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// Configurations
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req, res,next){
    const token = req.headers.token;
    const user = jwt.verify(token,JWT_SECRET);

    if(user){
        req.email = user.email;
        next();
    } else {
        res.status(403).json({
            message:"Incorrect credentials"
        });
    }
}

module.exports = {
    authenticate,
    JWT_SECRET
}