/**
 * Exhibits client api
 * /exhibit 
 * Interface for elastic search api
 */

const router = require('express').Router();
const controller = require('./controller');
const { sanitizeElasticQuery } = require('../../middlewares/exhibits-api.elastic.middleware');

router.get('/', (req, res) => {
  controller.getExhibits(req, res);
});

router.use('/', sanitizeElasticQuery);

router.get('/:id', (req, res) => {
  controller.getExhibit(req, res);
});

router.get('/:id/items', (req, res) => {
  controller.getExhibitItems(req, res);
});

module.exports = router;
