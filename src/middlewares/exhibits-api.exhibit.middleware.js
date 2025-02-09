const { param } = require('express-validator');
const Logger = require('../libs/log4js');

const exhibitIdValidator = async (req, res, next) => {
    validate(req, res, next, [
        param('id').isLength({min: 1, max: 50}).withMessage("id param length range: 1-50 characters"),
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
    exhibitIdValidator
};