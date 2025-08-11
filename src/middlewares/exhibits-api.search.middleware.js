const { query } = require('express-validator');
const { validate } = require('../middlewares/exhibits-api.validate.middleware');

const searchIndexValidator = async (req, res, next) => {
    const validTypes = ['exhibit', 'item', null];
    
    validate(req, res, next, [
        query('q').notEmpty(),
        query('q').isLength({min: 1, max: 50}).withMessage("q length range: 1-50 characters"),
        query('type').isIn(validTypes).withMessage(`valid type values: ${validTypes.toString()}`),
        query('exhibitId').isLength({ max: 50 }).withMessage("exhibitId length range: 1-50 characters")
    ]);
}

module.exports = {
    searchIndexValidator
};