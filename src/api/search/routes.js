/**
 * Exhibits client api
 * /search 
 * Interface for elastic search api
 */

const router = require('express').Router();
const controller = require('./controller');
const { sanitizeElasticQuery } = require('../../middlewares/exhibits-api.elastic.middleware');

router.use('/', sanitizeElasticQuery);

router.get('/', (req, res) => {
    controller.searchIndex(req, res);
});

module.exports = router;
