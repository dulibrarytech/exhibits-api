/**
 * Exhibits api
 * /exhibit 
 * Interface for exhibit api
 */

const ROUTER = require('express').Router();
const CONTROLLER = require('./controller');
const { sanitizeElasticQuery } = require('../../middlewares/exhibits-api.elastic.middleware');
const { exhibitIdValidator } = require('../../middlewares/exhibits-api.exhibit.middleware');
const { validateApiKey } = require('../../middlewares/exhibits-api.authentication.middleware');

ROUTER.get('/', (req, res) => {
  CONTROLLER.getExhibits(req, res);
});

ROUTER.use('/:id', [sanitizeElasticQuery, exhibitIdValidator]);

ROUTER.get('/:id', (req, res) => {
  CONTROLLER.getExhibit(req, res);
});

ROUTER.get('/:id/items', (req, res) => {
  CONTROLLER.getExhibitItems(req, res);
});

ROUTER.get('/:id/resource/:filename', (req, res) => {
  console.log("TEST GET /:id/resource/:filename")
  CONTROLLER.getExhibitItemResource(req, res);
});

module.exports = ROUTER;
