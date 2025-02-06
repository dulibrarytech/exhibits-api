/**
 * Exhibits client api
 * /repository 
 * Interface for digital repository api
 */

const ROUTER = require('express').Router();
const CONTROLLER = require('./controller');

const { validateApiKey } = require('../../middlewares/exhibits-api.authentication.middleware');
const { fetchSourceFileValidator, getDataValidator } = require('../../middlewares/exhibits-api.repository.middleware');

/////////////////
// public routes
/////////////////
ROUTER.get('/data/:id', getDataValidator, (req, res) => {
  CONTROLLER.getData(req, res);
});

ROUTER.post('/search', (req, res) => {
  CONTROLLER.search(req, res);
});

////////////////////
// protected routes
////////////////////
ROUTER.use('/source/fetch', validateApiKey);

ROUTER.post('/source/fetch/:id', fetchSourceFileValidator, async (req, res) => {  
  CONTROLLER.fetchSourceFile(req, res);
});

module.exports = ROUTER;