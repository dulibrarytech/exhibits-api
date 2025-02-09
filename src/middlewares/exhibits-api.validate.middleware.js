const Logger = require('../libs/log4js');

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
    validate
};