/**
 * Exhibits client api
 * /repository 
 * Interface for digital repository api
 */

const router = require('express').Router();
const controller = require('./controller');
const { validateApiKey } = require('../../middlewares/exhibits-api.authentication.middleware');

router.get('/data/:id', (req, res) => {
  controller.getData(req, res);
});

router.post('/search', (req, res) => {
  controller.search(req, res);
});

router.use('/source/fetch', validateApiKey);

router.post('/source/fetch/:id', (req, res) => {
  controller.fetchSourceFile(req, res);
});

module.exports = router;