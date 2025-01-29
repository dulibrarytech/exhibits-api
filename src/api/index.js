const router = require('express').Router();
const exhibit = require('./exhibit/routes');
const search = require('./search/routes');
const repository = require('./repository/routes');

const { sanitizeElasticQuery } = require('../middlewares/exhibits-api.elastic.middleware');

router.get('/', (req, res) => {
  res.sendStatus(200);
});

router.use('/repository', repository);

router.use('/', sanitizeElasticQuery);
// router.use('/index', sanitizeElasticQuery);

// router.use('/repository', repository);

router.use('/exhibit', exhibit);
router.use('/search', search);
// router.use('/index/exhibit', exhibit);
// router.use('/index/search', search);

module.exports = router;
