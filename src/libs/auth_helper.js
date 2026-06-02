'use strict'

const CONFIG = require('../config/configuration.js');

exports.validateKey = (key) => {
    return key && key == CONFIG.apiKey;
}