const router = require('express').Router();
const exhibit = require('./exhibit/routes');
const search = require('./search/routes');

const { sanitizeElasticQuery } = require('../middlewares/elastic.middleware');

router.get('/', (req, res) => {
  res.sendStatus(200);
});

router.use('/', sanitizeElasticQuery);

router.use('/exhibit', exhibit);
router.use('/search', search);

module.exports = router;
