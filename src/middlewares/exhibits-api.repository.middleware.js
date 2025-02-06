const { param, body } = require('express-validator');
const Logger = require('../libs/log4js');

const getDataValidator = async (req, res, next) => {
    validate(req, res, next, [
        param('id').isLength({min: 1, max: 50}).withMessage("id param length range: 1-50 characters"),
    ]);
}

const fetchSourceFileValidator = async (req, res, next) => {
    validate(req, res, next, [
        param('id').isLength({min: 1, max: 50}).withMessage("id param length range: 1-50 characters"),
        body('exhibitItemId').notEmpty(),
        body('fileExtension').notEmpty(),
        body('exhibitItemId').isLength({min: 1, max: 50}).withMessage("exhibitItemId value length range: 1-50 characters"),
        body('fileExtension').isLength({min: 3, max: 4}).withMessage("fileExtension value length range: 3-4 characters")
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
    getDataValidator,
    fetchSourceFileValidator
};