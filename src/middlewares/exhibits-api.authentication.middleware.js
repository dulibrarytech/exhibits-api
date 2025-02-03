const CONFIG = require('../config/configuration.js');

const validateApiKey = async (req, res, next) => {
    let key = req.query?.key || "";

    if(key == CONFIG.apiKey) {
        next();
    }
    else {
        console.log("Invalid api key");
        res.status(403).send();
    }
}

module.exports = {
    validateApiKey
};