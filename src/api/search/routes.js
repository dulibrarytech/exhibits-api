/**
 * Exhibits client api
 * /search 
 * Interface for elastic search api
 */

const ROUTER = require('express').Router();
const CONTROLLER = require('./controller');
const { sanitizeElasticQuery } = require('../../middlewares/exhibits-api.elastic.middleware');
const { searchIndexValidator } = require('../../middlewares/exhibits-api.search.middleware');

ROUTER.use('/', sanitizeElasticQuery);

ROUTER.get('/', searchIndexValidator, (req, res) => {
    CONTROLLER.searchIndex(req, res);
});

module.exports = ROUTER;
