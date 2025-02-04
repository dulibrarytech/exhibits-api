const router = require('express').Router();
const exhibit = require('./exhibit/routes');
const search = require('./search/routes');
const repository = require('./repository/routes');

router.get('/', (req, res) => {
  res.sendStatus(200);
});

router.use('/repository', repository);
router.use('/exhibit', exhibit);
router.use('/search', search);

module.exports = router;
