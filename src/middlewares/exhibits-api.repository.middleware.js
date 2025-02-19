const { param, body } = require('express-validator');
const { validate } = require('../middlewares/exhibits-api.validate.middleware');

const getDataValidator = async (req, res, next) => {
    validate(req, res, next, [
        param('id').isLength({min: 1, max: 50}).withMessage("id param length range: 1-50 characters"),
    ]);
}

const fetchResourceFileValidator = async (req, res, next) => {
    const validFileExtensions = ['png', 'jpg', 'jpeg', 'tif', 'tiff', 'mp3', 'mp4', 'pdf'];

    validate(req, res, next, [
        param('id').isLength({min: 1, max: 50}).withMessage("id param length range: 1-50 characters"),
        body('exhibitItemId').notEmpty(),
        body('fileExtension').notEmpty(),
        body('exhibitItemId').isLength({min: 1, max: 50}).withMessage("exhibitItemId value length range: 1-50 characters"),
        body('fileExtension').isLength({min: 3, max: 4}).withMessage("fileExtension value length range: 3-4 characters"),
        body('fileExtension').isIn(validFileExtensions).withMessage(`Valid file extensions: ${validFileExtensions.toString()}`),
    ]);
}
  
module.exports = {
    getDataValidator,
    fetchResourceFileValidator
};