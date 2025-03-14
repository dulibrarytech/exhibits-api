const { param, body } = require('express-validator');
const { validate } = require('../middlewares/exhibits-api.validate.middleware');

const getDataValidator = async (req, res, next) => {
    validate(req, res, next, [
        param('id').isLength({min: 1, max: 50}).withMessage("id param length range: 1-50 characters"),
    ]);
}

const fetchResourceFileValidator = async (req, res, next) => {
    validate(req, res, next, [
        param('id').isLength({min: 1, max: 50}).withMessage("id param length range: 1-50 characters"),
        body('exhibitItemId').notEmpty(),
        body('exhibitItemId').isLength({min: 1, max: 50}).withMessage("exhibitItemId value length range: 1-50 characters"),
    ]);
}
  
module.exports = {
    getDataValidator,
    fetchResourceFileValidator
};