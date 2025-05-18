/**
 * Exhibits api
 * /repository 
 * Interface for digital repository api
 */

const ROUTER = require('express').Router();
const CONTROLLER = require('./controller');

const { validateApiKey } = require('../../middlewares/exhibits-api.authentication.middleware');
const { fetchResourceFileValidator, getDataValidator } = require('../../middlewares/exhibits-api.repository.middleware');

ROUTER.get('/data/:id', getDataValidator, (req, res) => {
  CONTROLLER.data(req, res);
});

ROUTER.post('/item/:id', validateApiKey, fetchResourceFileValidator, async (req, res) => {
  CONTROLLER.item(req, res);
});

ROUTER.post('/search', (req, res) => {
  CONTROLLER.search(req, res);
});

module.exports = ROUTER;