/**
 * Exhibits client api
 * /repository 
 * Interface for digital repository api
 */

const router = require('express').Router();
const controller = require('./controller');

router.get('/data/:id', (req, res) => {
  controller.getData(req, res);
});

router.get('/search', (req, res) => {
  controller.search(req, res);
});

router.post('/source/fetch/:id', (req, res) => {
  controller.fetchSource(req, res);
});

module.exports = router;