const ROUTER = require('express').Router();
const EXHIBIT = require('./exhibit/routes');
const SEARCH = require('./search/routes');
const REPOSITORY = require('./repository/routes');
const LOGGER = require('../libs/log4js');

ROUTER.get('/', (req, res) => {
  res.sendStatus(200);
});

ROUTER.use('/', (req, res, next) => {
  LOGGER.module().info(`${req.method} ${req.path}`);
  next();
});

ROUTER.use('/exhibit', EXHIBIT);
ROUTER.use('/search', SEARCH);
ROUTER.use('/repository', REPOSITORY);

module.exports = ROUTER;
