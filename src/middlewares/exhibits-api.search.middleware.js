const { query } = require('express-validator');
const Logger = require('../libs/log4js');

const searchIndexValidator = async (req, res, next) => {
    const validTypes = ['exhibit', 'item'];

    validate(req, res, next, [
        query('q').notEmpty(),
        query('q').isLength({min: 1, max: 50}).withMessage("q length range: 1-50 characters"),
        query('page').isInt({ min: 1, max: 100 }).withMessage("page must be an integer between 1 and 100"),
        query('type').isIn(validTypes).withMessage("valid type values: 'item', 'exhibit'"),
        query('exhibitId').isLength({ max: 50 }).withMessage("exhibitId length range: 1-50 characters")
    ]);
}

const validate = async (req, res, next, validations) => {
    for (const validation of validations) {
        const errors = await validation.run(req);
        if (!errors.isEmpty()) {
            Logger.module().info(`Invalid request value(s): ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }
    }

    next();
}

module.exports = {
    searchIndexValidator
};