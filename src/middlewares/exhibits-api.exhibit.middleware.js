const { param } = require('express-validator');
const { validate } = require('../middlewares/exhibits-api.validate.middleware');

const exhibitIdValidator = async (req, res, next) => {
    validate(req, res, next, [
        param('id').isLength({min: 1, max: 50}).withMessage("id param length range: 1-50 characters"),
    ]);
}
  
module.exports = {
    exhibitIdValidator
};